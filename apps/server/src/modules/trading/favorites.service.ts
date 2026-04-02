import { prisma } from "@repo/database";

export class FavoritesService {
  // 1. Переключить статус (Лайк/Анлайк) 🔄
  static async toggleFavorite(userId: string, motorcycleId: string) {
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

  // 2. Получить список ID избранного (для синхронизации иконок) 🆔
  static async getFavoriteIds(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { motorcycleId: true },
    });
    return favorites.map((f) => f.motorcycleId);
  }

  // 3. Получить полные данные избранных моделей (для страницы "Моё избранное") 🏍️
  static async getFavoritesFull(userId: string) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        motorcycle: {
          include: { brand: true, images: { take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  //Пернуть полные данные о моделях по массиву id от юзера:
  static async getFavoritesByIds(
    ids: string[],
    limit: number = 20,
    skip: number = 0,
  ) {
    const items = await prisma.motorcycle.findMany({
      where: { id: { in: ids } }, //Ищем только те, что в массиве избранного
      include: { brand: true },
      take: limit,
      skip: skip,
    });

    return {
      items,
      hasMore: skip + limit < ids.length, //Есть ли, что подгружать дальше
    };
  }
}
