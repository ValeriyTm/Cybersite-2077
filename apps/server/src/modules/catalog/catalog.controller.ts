import { Request, Response, NextFunction } from "express";
import { catalogService } from "./catalog.service.js";
import { searchService } from "./search.service.js";

export class CatalogController {
  //Получение главных категорий:
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      //Получаем данные с БД:
      const categories = await catalogService.getSiteCategories();

      //Форматируем ответ согласно OpenAPI (переименовываем _count в motorcyclesCount):
      const result = categories.map((cat) => ({
        ...cat,
        motorcyclesCount: cat._count.motorcycles,
        _count: undefined, // Убираем техническое поле Prisma
      }));

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  //Получение списка всех брендов мотоциклов:
  async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      //Вытаскиваем параметры из адресной строки и приводим к числам с дефолтными значениями:
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string; //Забираем строку поиска

      const { items, total, pages } = await catalogService.getBrands(
        page,
        limit,
        search,
      );

      //Мапим результат, чтобы соответствовать схеме Brand из OpenAPI:
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
    } catch (error) {
      next(error);
    }
  }

  //Получение всех мотоциклов конкретного бренда:
  async getMotorcycles(req: Request, res: Response, next: NextFunction) {
    try {
      // Собираем все фильтры из строки запроса (?brandSlug=honda&year=2021)
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
      };

      const result = await searchService.searchMotorcycles(filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  //Получение информации о конкретном мотоцикле:
  async getMotorcycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { brandSlug, slug } = req.params;
      const motorcycle = await catalogService.getMotorcycleBySlug(slug);

      if (!motorcycle) {
        return res.status(404).json({ message: "Мотоцикл не найден" });
      }

      // Проверяем на соответствие бренду (для SEO и безопасности)
      // if (motorcycle.brand.slug !== brandSlug) {
      //   return res.status(400).json({
      //     message: 'Несоответствие бренда и модели'
      //   });
      // }

      res.status(200).json(motorcycle);
    } catch (error) {
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
