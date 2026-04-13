//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Сервис из модуля Warehouse:
import { warehouseService } from "../warehouse/index.js";
//Логика расчёта цены с учетом скидок (из модуля Discount):
import { discountLogic } from "../discount/index.js";

export class CartService {
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
    const ids = cartItems.map((item: any) => item.id);

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
      cartItems.map(async (item: any) => {
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
        };
      }),
    );

    return enrichedCart.filter(Boolean);
  }

  //Добавить товар в корзину / обновить количество:
  async addToCart(userId: string, item: any) {
    const cart = await this.getCart(userId);
    const existing = cart.find((i: any) => i.id === item.id);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      //Сохраняем все данные, нужные для отрисовки макета:
      cart.push({
        id: item.id,
        model: item.model,
        price: item.price,
        image: item.image,
        slug: item.slug,
        brandSlug: item.brandSlug,
        quantity: item.quantity,
        year: item.year,
        selected: true, //Поле для чекбокса выбора
      });
    }

    //Метод setex устанавливает время хранения данных на 7 дней:
    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    return cart;
  }

  //Изменить количество для конкретной позиции:
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    //1) Идем в PostgreSQL через WarehouseService и узнаем доступные не зарезервированные остатки на складах:
    const available = await warehouseService.getAvailableStock(itemId);

    //2) Ограничиваем максимальное количество тем, что реально есть на складах:
    const finalQuantity = Math.min(quantity, available);

    const cart = await this.getCart(userId);
    const item = cart.find((i: any) => i.id === itemId);

    if (item) {
      //Не даем опуститься ниже 1:
      item.quantity = Math.max(1, finalQuantity);

      //Метод setex устанавливает время хранения данных на 7 дней:
      await redis.setex(
        `cart:${userId}`,
        60 * 60 * 24 * 7,
        JSON.stringify(cart),
      );
    }
    return cart;
  }

  //Удалить позицию из корзины:
  async removeItem(userId: string, itemId: string) {
    let cart = await this.getCart(userId);
    //Создаём новый отфильтрованный список товаров,  из которого исключен элемент с указанным itemId:
    cart = cart.filter((i: any) => i.id !== itemId);

    //Обновленный список (уже без удаленного товара) переводится в строку JSON и записывается обратно в Redis:
    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    //Метод setex устанавливает время хранения данных на 7 дней

    return cart;
  }

  //Удаление всех позиций из корзины:
  async removeMultiple(userId: string, itemIds: string[]) {
    let cart = await this.getCart(userId);
    cart = cart.filter((i: any) => !itemIds.includes(i.id));

    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    return cart;
  }

  //Метод переключения одного товара в корзине:
  async toggleSelectItem(
    userId: string,
    motorcycleId: string,
    isSelected: boolean,
  ) {
    const key = this.getCartKey(userId);
    const data = await redis.get(key);
    const cartItems = data ? JSON.parse(data) : [];

    const updatedCart = cartItems.map((item: any) =>
      item.id === motorcycleId ? { ...item, selected: isSelected } : item,
    );

    await redis.set(key, JSON.stringify(updatedCart));
    return this.getCart(userId); //Возвращаем полную корзину с данными из БД и скидками
  }

  //Метод для работы чекбокса "Выбрать всё / Снять всё" для товаров корзины:
  async toggleSelectAll(userId: string, isSelected: boolean) {
    const key = this.getCartKey(userId);
    const data = await redis.get(key);
    const cartItems = data ? JSON.parse(data) : [];

    const updatedCart = cartItems.map((item: any) => ({
      ...item,
      selected: isSelected,
    }));

    await redis.set(key, JSON.stringify(updatedCart));
    return this.getCart(userId);
  }
}

export const cartService = new CartService();
