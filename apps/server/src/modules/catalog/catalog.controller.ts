import { Request, Response, NextFunction } from "express";
import { catalogService } from "./catalog.service.js";

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

  //Получение списка брендов с пагинацией
  async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      //Вытаскиваем параметры из адресной строки и приводим к числам с дефолтными значениями:
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { items, total, pages } = await catalogService.getBrands(
        page,
        limit,
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
}

export const catalogController = new CatalogController();
