//Клиент призмы для работы с БД:
import { prisma } from "@repo/database";

export class CatalogService {
  //Получение основных категорий приложения:
  async getSiteCategories() {
    return await prisma.siteCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        description: true,
        _count: {
          select: { motorcycles: true }, //Считаем общее кол-во товаров в категории
        },
      },
      orderBy: { name: "asc" },
    });
  }

  //Получение списка брендов:
  async getBrands(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    // Создаем объект фильтрации
    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const [items, total] = await Promise.all([
      prisma.brand.findMany({
        where, //Применяем поиск по имени
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          country: true,
          slug: true,
          image: true,
          _count: {
            select: { motorcycles: true }, //motorcyclesCount (общее кол-во мотоциклов конкретного бренда)
          },
        },
        orderBy: { name: "asc" }, //Сортируем по алфавиту по умолчанию
      }),
      prisma.brand.count({ where }), //Считаем количество только найденных брендов
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  //Получение данных о конкретном мотоцикле:
  async getMotorcycleBySlug(slug: string) {
    // Достаем из БД все данные о мотоцикле:
    const moto = await prisma.motorcycle.findUnique({
      where: { slug },
      include: {
        brand: true,
        siteCategory: true,
        images: true, //Галерея изображений
        //Подтягиваем остатки со всех складов:
        stocks: {
          select: { quantity: true, reserved: true },
        },
      },
    });

    if (!moto) return null;

    // Считаем общее доступное количество для фронтенда
    const totalInStock = moto.stocks.reduce(
      (acc, s) => acc + (s.quantity - s.reserved),
      0,
    );

    return { ...moto, totalInStock };
  }
}

export const catalogService = new CatalogService();
