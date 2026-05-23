//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Логика расчёта цены с учетом скидок (из модуля Discount):
import { discountLogic } from "../discount/index.js";

export class FavoritesService {
  //Переключить статус (в избранном / не в избранном):
  async toggleFavorite(userId: string, motorcycleId: string) {
    //Ищем, есть ли уже такая запись:
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_motorcycleId: { userId, motorcycleId },
      },
    });

    if (existing) {
      //Если есть — удаляем:
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false };
    }

    //Если нет — создаем:
    await prisma.favorite.create({
      data: { userId, motorcycleId },
    });
    return { isFavorite: true };
  }

  //Получить список ID избранного (для синхронизации иконок):
  async getFavoriteIds(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { motorcycleId: true },
    });
    return favorites.map((f) => f.motorcycleId);
  }

  //Пернуть полные данные о моделях по массиву id от юзера:
  async getFavoritesByIds(
    ids: string[],
    limit: number = 20,
    skip: number = 0,
    userId?: string,
  ) {
    const motorcycles = await prisma.motorcycle.findMany({
      where: { id: { in: ids } },
      include: {
        brand: true,
        images: { where: { isMain: true }, take: 1 },
        stocks: {
          select: { quantity: true, reserved: true },
        },
      },
      take: limit,
      skip,
    });

    if (motorcycles.length === 0) {
      return { items: [], hasMore: false };
    }

    //Получаем скидки:
    const allDiscountData = await discountLogic.calculateFinalPricesBulk(
      motorcycles,
      userId,
    );

    //Склеиваем остатки и скидки в памяти:
    const items = motorcycles.map((moto, index) => {
      const totalInStock = moto.stocks.reduce(
        (acc, s) => acc + (s.quantity - s.reserved),
        0,
      );

      return {
        ...moto,
        totalInStock,
        discountData: allDiscountData[index], // Берем данные из пакетного ответа по индексу
      };
    });

    return {
      items,
      hasMore: skip + limit < ids.length,
    };
  }

  //Получить количество товаров в избранном:
  async getFavoritesCount(userId: string) {
    return await prisma.favorite.count({
      where: { userId },
    });
  }
}

export const favoritesService = new FavoritesService();
