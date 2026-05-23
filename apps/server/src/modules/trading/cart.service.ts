//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Сервис из модуля Warehouse:
import { warehouseService } from "../warehouse/index.js";
//Логика расчёта цены с учетом скидок (из модуля Discount):
import { discountLogic } from "../discount/index.js";
//Типы:
import { AddToCartArgs } from "@repo/validation";

//Заменяем в типе motorcycleId на id:
type CartItem = Omit<AddToCartArgs, "motorcycleId"> & {
  id: string;
  selected: boolean;
};

export class CartService {
  //Удобный перевод userId в название записи в хранилище Redis:
  private getCartKey(userId: string) {
    return `cart:${userId}`;
  }

  //Получить товары в корзине:
  async getCart(userId: string) {
    const cartKey = this.getCartKey(userId);

    //Получаем массив всех JSON-строк товаров из хэша Redis:
    const rawItems = await redis.hvals(cartKey);
    if (!rawItems || rawItems.length === 0) return [];

    //Парсим каждую строку, чтобы получить массив объектов CartItem:
    const cartItems: CartItem[] = rawItems.map((item) => JSON.parse(item));

    //Собираем все ID товаров из корзины:
    const ids = cartItems.map((item: CartItem) => item.id);

    //Получаем полные данные мотоциклов (нужны для года выпуска и цены):
    const motorcycles = await prisma.motorcycle.findMany({
      where: { id: { in: ids } },
      include: {
        brand: true,
        images: { where: { isMain: true }, take: 1 },
      },
    });

    //Получаем актуальные остатки из БД:
    const stocks = await prisma.stock.groupBy({
      by: ["motorcycleId"],
      _sum: {
        quantity: true,
        reserved: true,
      },
      where: {
        motorcycleId: { in: ids },
      },
    });

    //Создаем карту для быстрого поиска: { "moto-uuid": 5 }:
    const stockMap = Object.fromEntries(
      stocks.map((s) => [
        s.motorcycleId,
        (s._sum.quantity || 0) - (s._sum.reserved || 0),
      ]),
    );

    //Финальная сборка и расчёт скидок:
    const enrichedCart = await Promise.all(
      cartItems.map(async (item: CartItem) => {
        const moto = motorcycles.find((m) => m.id === item.id);
        if (!moto) return null;

        //Рассчитываем скидку для этого товара и этого юзера:
        const discountData = await discountLogic.calculateFinalPrice(
          moto,
          userId,
        );

        return {
          ...moto, //Данные из БД (модель, бренд, базовая цена)
          selected: item.selected, //Чекбокс выбора
          quantity: item.quantity,
          totalInStock: stockMap[item.id] || 0, //Если товара нет в таблице Stock, то указываем "0"
          discountData, //Скидки { finalPrice, discountPercent, isPersonal }
        }; //Возвращаем полную корзину с данными из БД и скидками
      }),
    );

    return enrichedCart.filter(Boolean);
  }

  //Добавить товар в корзину / обновить количество:
  async addToCart(userId: string, item: AddToCartArgs) {
    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);
    //id товара:
    const itemId = item.motorcycleId;

    //Получаем из хэша конкретный товар по его ID:
    const existingItemRaw = await redis.hget(cartKey, itemId);

    let updatedItem: CartItem;

    if (existingItemRaw) {
      // Если товар есть, парсим только его и увеличиваем количество:
      const existingItem: CartItem = JSON.parse(existingItemRaw);
      updatedItem = {
        ...existingItem,
        quantity: existingItem.quantity + item.quantity,
      };
    } else {
      //Если товара нет, создаем новый объект:
      updatedItem = {
        id: item.motorcycleId,
        model: item.model,
        price: item.price,
        image: item.image,
        slug: item.slug,
        quantity: item.quantity,
        year: item.year,
        selected: true,
      };
    }

    //Записываем обновленный товар обратно в хэш под своим ID:
    await redis.hset(cartKey, itemId, JSON.stringify(updatedItem));

    //Обновляем время жизни всей корзины (7 дней):
    await redis.expire(cartKey, 60 * 60 * 24 * 7);

    //Возвращаем актуальную корзину, обогащенную данными о остатках, скидках и хар-ках:
    return this.getCart(userId);
  }

  //Изменить количество для конкретной позиции:
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    //Идем в PostgreSQL через WarehouseService и узнаем доступные не зарезервированные остатки на складах:
    const available = await warehouseService.getAvailableStock(itemId);
    //Ограничиваем максимальное количество тем, что реально есть на складах (а минимальное - единицей):
    const finalQuantity = Math.max(1, Math.min(quantity, available));

    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);

    //Получаем из хэша конкретный товар по его ID:
    const itemRaw = await redis.hget(cartKey, itemId);
    if (!itemRaw) return []; // Если товара нет в корзине, возвращаем пустой массив (или можно выкинуть ошибку)

    //Парсим этот один товар и обновляем у него количество:
    const cartItem: CartItem = JSON.parse(itemRaw);
    cartItem.quantity = finalQuantity;

    //Записываем обновленный товар обратно в хэш под своим ID:
    await redis.hset(cartKey, itemId, JSON.stringify(cartItem));

    //Обновляем время жизни всей корзины (7 дней):
    await redis.expire(cartKey, 60 * 60 * 24 * 7);

    //Возвращаем актуальную корзину, обогащенную данными о остатках, скидках и хар-ках:
    return this.getCart(userId);
  }

  //Удалить позицию из корзины:
  async removeItem(userId: string, itemId: string) {
    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);

    //Удаляем конкретное поле (товар) из хэша Redis:
    await redis.hdel(cartKey, itemId);

    //Обновляем время жизни всей корзины на 7 дней:
    await redis.expire(cartKey, 60 * 60 * 24 * 7);

    //Возвращаем актуальную корзину, обогащенную данными о остатках, скидках и хар-ках:
    return this.getCart(userId);
  }

  //Удаление всех выбранных позиций из корзины:
  async removeMultiple(userId: string, itemIds: string[]) {
    if (!itemIds || itemIds.length === 0) {
      return this.getCart(userId);
    }

    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);

    //Удаление всех перечисленных в itemIds мотоциклов:
    await redis.hdel(cartKey, ...itemIds);

    //Обновляем время жизни корзины (7 дней):
    await redis.expire(cartKey, 60 * 60 * 24 * 7);

    //Возвращаем актуальную корзину, обогащенную данными о остатках, скидках и хар-ках:
    return this.getCart(userId);
  }

  //Метод переключения одного товара в корзине:
  async toggleSelectItem(
    userId: string,
    motorcycleId: string,
    isSelected: boolean,
  ) {
    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);

    //Получаем из хэша конкретный товар по его ID:
    const itemRaw = await redis.hget(cartKey, motorcycleId);

    //Если товара нет в корзине, просто возвращаем текущее состояние корзины:
    if (!itemRaw) return this.getCart(userId);

    //Парсим товар и обновляем у него поле selected:
    const cartItem: CartItem = JSON.parse(itemRaw);
    cartItem.selected = isSelected;

    //Записываем обновленный товар обратно в хэш под своим ID:
    await redis.hset(cartKey, motorcycleId, JSON.stringify(cartItem));

    //Обновляем время жизни всей корзины (7 дней):
    await redis.expire(cartKey, 60 * 60 * 24 * 7);

    //Возвращаем актуальную корзину, обогащенную данными о остатках, скидках и хар-ках:
    return this.getCart(userId);
  }

  //Метод для работы чекбокса "Выбрать всё / Снять всё" для товаров корзины:
  async toggleSelectAll(userId: string, isSelected: boolean) {
    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);

    //Получаем все товары:
    const rawItems = await redis.hvals(cartKey);
    if (!rawItems || rawItems.length === 0) return [];

    //Открываем пайплайн для массовой записи в Redis за один сетевой запрос:
    const pipeline = redis.pipeline();

    rawItems.forEach((itemRaw) => {
      const item: CartItem = JSON.parse(itemRaw);
      item.selected = isSelected;
      pipeline.hset(cartKey, item.id, JSON.stringify(item));
    });

    //Обновляем время жизни корзины (7 дней):
    pipeline.expire(cartKey, 60 * 60 * 24 * 7);

    //Выполняем все накопленные команды hset разом:
    await pipeline.exec();
    //Метод pipeline() собирает все вызовы .hset() в один пакет и отправляет их в Redis за один единственный сетевой запрос.

    //Возвращаем актуальную корзину, обогащенную данными о остатках, скидках и хар-ках:
    return this.getCart(userId);
  }
}

export const cartService = new CartService();
