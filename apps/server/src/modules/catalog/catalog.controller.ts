import { Request, Response, NextFunction } from "express";
import { catalogService } from "./catalog.service.js";
import { searchService } from "./search.service.js";
import { sitemapService } from "./sitemap.service.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";

//Получение главных категорий:
export const getCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //Получаем данные с БД:
    const categories = await catalogService.getSiteCategories();

    //Форматируем ответ согласно OpenAPI (переименовываем _count в motorcyclesCount):
    const result = categories.map((cat) => ({
      ...cat,
      motorcyclesCount: cat._count.motorcycles,
      _count: undefined, //Убираем техническое поле Prisma
    }));

    res.status(200).json(result);
  },
);

//Получение списка всех брендов мотоциклов:
export const getBrands = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //Вытаскиваем параметры из адресной строки и приводим к числам с дефолтными значениями:
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string; //Забираем строку поиска

    const { items, total, pages } = await catalogService.getBrands(
      page,
      limit,
      search,
    );

    //Мапим результат:
    const formattedItems = items.map((brand) => ({
      ...brand,
      motorcyclesCount: brand._count.motorcycles,
      _count: undefined,
    }));

    res.status(200).json({
      items: formattedItems,
      total,
      page,
      pages,
    });
  },
);

//Получение всех мотоциклов конкретного бренда:
export const getMotorcycles = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Собираем все значеняи из фильтров из строки запроса:
    const filters = {
      brandSlug: req.query.brandSlug as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice
        ? parseInt(req.query.minPrice as string)
        : undefined,
      maxPrice: req.query.maxPrice
        ? parseInt(req.query.maxPrice as string)
        : undefined,
      minYear: req.query.minYear
        ? parseInt(req.query.minYear as string)
        : undefined,
      maxYear: req.query.maxYear
        ? parseInt(req.query.maxYear as string)
        : undefined,
      category: req.query.category as string,
      transmission: req.query.transmission as string,
      minDisplacement: req.query.minDisplacement
        ? parseInt(req.query.minDisplacement as string)
        : undefined,
      maxDisplacement: req.query.maxDisplacement
        ? parseInt(req.query.maxDisplacement as string)
        : undefined,
      minPower: req.query.minPower
        ? parseInt(req.query.minPower as string)
        : undefined,
      maxPower: req.query.maxPower
        ? parseInt(req.query.maxPower as string)
        : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string,
      onlyInStock: req.query.onlyInStock as string,
    };

    // Достаем userId из токена (если он есть; если нет, то персональные скидки будет не доступны)
    const userId = req.user?.id;

    const result = await searchService.searchMotorcycles(filters, userId);
    res.status(200).json(result);
  },
);

//Получение информации о конкретном мотоцикле:
export const getMotorcycle = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { brandSlug, slug } = req.params;
    const userId = req.user?.id; //Здесь либо UUID, либо undefined, в зависимости от того, авторизован ли юзер

    const motorcycle = await catalogService.getMotorcycleBySlug(slug, userId);

    if (!motorcycle) {
      return res.status(404).json({ message: "Мотоцикл не найден" });
    }

    res.status(200).json(motorcycle);
  },
);

//Поиск аналогичных мотоциклов (рекомендации):
export const getRelated = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { slug } = req.params;
    const userId = req.user?.id;
    const motorcycle = await catalogService.getMotorcycleBySlug(slug, userId);
    if (!motorcycle) return res.status(404).send();

    const related = await searchService.getRelatedMotorcycles(
      motorcycle,
      userId,
    );
    res.json(related);
  },
);

//Поиск с выводом предположений:
export const getSuggestions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.json([]); //Ищем от 2-х символов

    const suggestions = await searchService.suggestMotorcycles(query);
    res.json(suggestions);
  },
);

export const getSitemap = async (req: Request, res: Response) => {
  const xml = await sitemapService.generateSitemapXml();
  res.header("Content-Type", "application/xml"); //Поисковик поймет, что это XML
  res.send(xml);
};
