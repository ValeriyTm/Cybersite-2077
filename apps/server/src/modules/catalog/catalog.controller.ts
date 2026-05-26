//Типы:
import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middlewares/authMiddleware.js";
//Сервисы модуля Catalog:
import { catalogService } from "./catalog.service.js";
import { searchService } from "./search.service.js";
import { sitemapService } from "./sitemap.service.js";
//Логика расчёта цены с учетом скидок (из модуля Discount):
import { discountLogic } from "../discount/index.js";
//Схемы валидации Zod:
import {
  GetBrandsArgs,
  GetSuggestionsArgs,
  MotoByIdServiceArgs,
  MotoBySlugServiceArgs,
  MotorcyclesServiceArgs,
  RelatedBySlugServiceArgs,
} from "@repo/validation";
//Типы:
import { MotorcycleFullServer } from "@repo/types";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
// Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";

//Получение главных категорий:
export const getCategories = catchAsync(
  async (_req: Request, res: Response) => {
    //Получаем данные с БД:
    const categories = await catalogService.getSiteCategories();

    //Форматируем ответ (переименовываем _count в motorcyclesCount):
    const result = categories.map((cat) => ({
      ...cat,
      motorcyclesCount: cat._count.motorcycles,
      _count: undefined, //Убираем техническое поле Prisma
    }));

    //Заголовки кэширования:
    res.header(
      "Cache-Control",
      "public, max-age=600, s-maxage=3600, stale-while-revalidate=600",
    );
    res.status(200).json(result);
  },
);

//Получение списка всех брендов мотоциклов:
export const getBrands = catchAsync(async (req: Request, res: Response) => {
  //Данные приходят в виде { page: 5, limit: 24, search: '' }
  const data = req.query as unknown as GetBrandsArgs;

  const { items, total, page, pages } = await catalogService.getBrands(data);

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
});

//Получение всех мотоциклов конкретного бренда:
export const getMotorcycles = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const data = req.query as unknown as MotorcyclesServiceArgs;
    console.log("data: ", data);

    // Достаем userId из токена (если он есть; если нет, то персональные скидки будет не доступны)
    const userId = req.user?.id;

    const result = await searchService.searchMotorcycles(data, userId);
    res.status(200).json(result);
  },
);

//Получение информации о конкретном мотоцикле по его slug:
export const getMotorcycle = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { slug } = req.params as MotoBySlugServiceArgs;
    const userId = req.user.id; //Здесь либо UUID, либо undefined, в зависимости от того, авторизован ли юзер

    const motorcycle = await catalogService.getMotorcycleBySlug(slug, userId);

    if (!motorcycle) {
      return res.status(404).json({ message: "Мотоцикл не найден" });
    }

    res.status(200).json(motorcycle);
  },
);

//Получение информации о конкретном мотоцикле по его id:
export const getMotorcycleById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as MotoByIdServiceArgs;
    const userId = req.user.id; //Здесь либо UUID, либо undefined, в зависимости от того, авторизован ли юзер

    const motorcycle = await catalogService.getMotorcycleById(id);

    if (!motorcycle) {
      throw new AppError(404, "Мотоцикл не найден");
    }

    // Считаем общее доступное количество для фронтенда
    const totalInStock = motorcycle.stocks.reduce(
      (acc, s) => acc + (s.quantity - s.reserved),
      0,
    );

    //Считаем скидку:
    const discountData = await discountLogic.calculateFinalPrice(
      motorcycle,
      userId,
    );

    const result = { ...motorcycle, totalInStock, discountData };

    res.json(result);
  },
);

//Поиск аналогичных мотоциклов (рекомендации):
export const getRelated = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { slug } = req.params as RelatedBySlugServiceArgs;
    const userId = req.user.id;

    const motorcycle = await catalogService.getMotorcycleBySlug(slug, userId);
    if (!motorcycle) return res.status(404).send();

    const related = await searchService.getRelatedMotorcycles(
      motorcycle as MotorcycleFullServer,
      userId,
    );
    res.json(related);
  },
);

//Поиск с выводом предположений:
export const getSuggestions = catchAsync(
  async (req: Request, res: Response) => {
    const { q: query } = req.query as GetSuggestionsArgs;
    if (!query || query.length < 2) return res.json([]); //Ищем от 2-х символов

    const suggestions = await searchService.suggestMotorcycles(query);
    res.json(suggestions);
  },
);

//Получение sitemap для каталога:
export const getSitemap = catchAsync(async (_req: Request, res: Response) => {
  const xml = await sitemapService.generateSitemapXml();
  //Кэширование, чтобы поисковики не нагружали сервер:
  res.header(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=60",
  );
  //Обязательный заголовок, чтобы поисковик распознал XML:
  res.header("Content-Type", "application/xml");
  res.send(xml);
});

//Запуск полной синхронизации Elasticsearch:
export const syncAllMotorcycles = catchAsync(
  async (_req: Request, res: Response) => {
    await searchService.syncAllMotorcycles();
    res.send("Синхронизация завершена! Можно убедиться в консоли бэкенда.");
  },
);
