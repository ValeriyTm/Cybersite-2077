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

// type RealCartItem =

export class CartService {
  //Удобный перевод userId в название записи в хранилище Redis:
  private getCartKey(userId: string) {
    return `cart:${userId}`;
  }

  //Получить товары в корзине:
  async getCart(userId: string) {
    //Получаем данные из корзины в Redis:
    const data = await redis.get(this.getCartKey(userId));
    const cartItems = data ? JSON.parse(data) : [];
    if (cartItems.length === 0) return [];

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
    //Получаем всю корзину:
    const cart = await redis.get(cartKey);
    //Получаем все итемы корзины:
    const cartItems: CartItem[] = cart ? JSON.parse(cart) : [];

    //Получаем конкретный итем:
    const existing = cartItems.find(
      (i: CartItem) => i.id === item.motorcycleId,
    );

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      //Сохраняем все данные, нужные для отрисовки макета:
      cartItems.push({
        id: item.motorcycleId,
        model: item.model,
        price: item.price,
        image: item.image,
        slug: item.slug,
        quantity: item.quantity,
        year: item.year,
        selected: true, //Поле для чекбокса выбора
      });
    }

    //Метод setex устанавливает время хранения данных на 7 дней:
    await redis.setex(cartKey, 60 * 60 * 24 * 7, JSON.stringify(cartItems));
    return cartItems;
  }

  //Изменить количество для конкретной позиции:
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    //Идем в PostgreSQL через WarehouseService и узнаем доступные не зарезервированные остатки на складах:
    const available = await warehouseService.getAvailableStock(itemId);
    //Ограничиваем максимальное количество тем, что реально есть на складах (а минимальное - единицей):
    const finalQuantity = Math.max(1, Math.min(quantity, available));

    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);
    //Получаем всю корзину:
    const cart = await redis.get(cartKey);
    //Получаем все итемы корзины:
    const cartItems: CartItem[] = cart ? JSON.parse(cart) : [];
    if (cartItems.length === 0) return [];

    //Получаем конкретный итем:
    const targetCartItem = cartItems.find(
      (item: CartItem) => item.id === itemId,
    );

    if (targetCartItem) {
      //Не даем опуститься ниже 1:
      targetCartItem.quantity = finalQuantity;

      //Метод setex устанавливает время хранения данных на 7 дней:
      await redis.setex(cartKey, 60 * 60 * 24 * 7, JSON.stringify(cartItems));
    }
    return cartItems;
  }

  //Удалить позицию из корзины:
  async removeItem(userId: string, itemId: string) {
    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);
    //Получаем всю корзину:
    const cart = await redis.get(cartKey);
    //Получаем все итемы корзины:
    let cartItems: CartItem[] = cart ? JSON.parse(cart) : [];
    if (cartItems.length === 0) return [];

    //Создаём новый отфильтрованный список товаров,  из которого исключен элемент с указанным itemId:
    cartItems = cartItems.filter((i: CartItem) => i.id !== itemId);

    //Обновленный список (уже без удаленного товара) переводится в строку JSON и записывается обратно в Redis:
    await redis.setex(cartKey, 60 * 60 * 24 * 7, JSON.stringify(cartItems));
    //Метод setex устанавливает время хранения данных на 7 дней

    return cartItems;
  }

  //Удаление всех позиций из корзины:
  async removeMultiple(userId: string, itemIds: string[]) {
    //Ключ корзины пользователя:
    const cartKey = this.getCartKey(userId);
    //Получаем всю корзину:
    const cart = await redis.get(cartKey);
    //Получаем все итемы корзины:
    let cartItems: CartItem[] = cart ? JSON.parse(cart) : [];
    if (cartItems.length === 0) return [];
    //Фильтруем (удаляем по id):
    cartItems = cartItems.filter((i: CartItem) => !itemIds.includes(i.id));

    await redis.setex(cartKey, 60 * 60 * 24 * 7, JSON.stringify(cartItems));
    return cartItems;
  }

  //Метод переключения одного товара в корзине:
  async toggleSelectItem(
    userId: string,
    motorcycleId: string,
    isSelected: boolean,
  ) {
    const cartKey = this.getCartKey(userId);
    const data = await redis.get(cartKey); //Получаем данные по корзине из Redis
    const cartItems = data ? JSON.parse(data) : [];
    //Если данные есть, превращаем строку JSON обратно в массив объектов.
    //Если данных нет (корзина пуста), создаем пустой массив.

    const updatedCart = cartItems.map((item: CartItem) =>
      item.id === motorcycleId ? { ...item, selected: isSelected } : item,
    );
    //Пробегаем по всем товарам в корзине. Если id товара совпадает с нужным motorcycleId, создаём
    //копию этого товара с обновленным полем selected. Остальные товары оставляем без изменений.

    await redis.set(cartKey, JSON.stringify(updatedCart)); //Сохраняем обновленный массив обратно в Redis, предварительно превратив его в строку
    return this.getCart(userId); //Возвращаем полную корзину с данными из БД и скидками
  }

  //Метод для работы чекбокса "Выбрать всё / Снять всё" для товаров корзины:
  async toggleSelectAll(userId: string, isSelected: boolean) {
    const cartKey = this.getCartKey(userId);
    const data = await redis.get(cartKey);
    const cartItems = data ? JSON.parse(data) : [];

    const updatedCart = cartItems.map((item: CartItem) => ({
      ...item,
      selected: isSelected,
    }));

    await redis.set(cartKey, JSON.stringify(updatedCart));
    return this.getCart(userId); //Возвращаем полную корзину с данными из БД и скидками
  }
}

export const cartService = new CartService();
