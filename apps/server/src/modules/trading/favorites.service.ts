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
    userId?: string, //Для расчёта скидок
  ) {
    const motorcycles = await prisma.motorcycle.findMany({
      where: { id: { in: ids } }, //Ищем только те, что в массиве избранного
      include: {
        brand: true,
        images: { where: { isMain: true }, take: 1 },
        stocks: {
          select: { quantity: true, reserved: true },
        },
      },
      take: limit,
      skip: skip,
    });

    //Рассчитываем остатки (totalInStock) и скидки для каждого мотоцикла:
    const items = await Promise.all(
      motorcycles.map(async (moto) => {
        const totalInStock = moto.stocks.reduce(
          (acc, s) => acc + (s.quantity - s.reserved),
          0,
        );

        const discountData = await discountLogic.calculateFinalPrice(
          moto,
          userId,
        );

        return {
          ...moto,
          totalInStock,
          discountData,
        };
      }),
    );

    return {
      items,
      hasMore: skip + limit < ids.length, //Есть ли, что подгружать дальше
    };
  }

  //Получить количество товаров в избранном:
  async getFavoritesCount(userId: string) {
    return await prisma.favorite.count({
      where: { userId: userId },
    });
  }
}

export const favoritesService = new FavoritesService();
