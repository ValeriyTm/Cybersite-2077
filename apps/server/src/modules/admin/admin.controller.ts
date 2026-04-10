//Этот контроллер будет отвечать за получение списков с пагинацией и поиском.

import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { ReportsService } from "../reports/reports.service.js";
import { PdfService } from "../reports/pdf.service.js";
import { ExcelService } from "../reports/excel.service.js";
import { searchService } from "../catalog/search.service.js";
import fs from "fs";
import path from "path";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

export class AdminController {
  // Метод для управления тикетами поддержки
  static async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await prisma.supportTicket.findMany({
        include: { attachments: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(tickets);
    } catch (error) {
      next(error);
    }
  }

  //Метод для получения отчетов:
  static async downloadReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params; // 'pdf' или 'xlsx'
      const stats = await ReportsService.getStatistics(30);

      let filePath: string;
      if (type === "xlsx") {
        filePath = await ExcelService.generateSalesRepo(stats);
        res.download(filePath);
      } else {
        filePath = await PdfService.generateSalesPdf(stats);
        res.contentType("application/pdf");
        res.sendFile(filePath);
      }
    } catch (error) {
      next(error);
    }
  }

  //---------------------Работа с брендами:-------------
  // Универсальный метод для получения списка брендов
  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [brands, total] = await Promise.all([
        prisma.brand.findMany({
          where: {
            name: { contains: String(search), mode: "insensitive" },
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.brand.count({
          where: { name: { contains: String(search), mode: "insensitive" } },
        }),
      ]);

      res.json({
        data: brands,
        meta: {
          total,
          page: Number(page),
          lastPage: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  //Метод для удаления бренда:
  static async deleteBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.brand.delete({ where: { id } });
      res.json({ message: "Бренд успешно удален" });
    } catch (error) {
      next(error);
    }
  }

  //Метод для создания бренда:
  static async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, country, slug } = req.body;
      const brand = await prisma.brand.create({
        data: { name, country, slug },
      });
      res.status(201).json(brand);
    } catch (error) {
      next(error);
    }
  }

  //Метод для изменения информации о бренде:
  static async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, country, slug } = req.body;
      const brand = await prisma.brand.update({
        where: { id },
        data: { name, country, slug },
      });
      res.json(brand);
    } catch (error) {
      next(error);
    }
  }
  //---------------------Работа с мотоциклами:-------------
  //Метод поиска бренда (нужен для создания новой записи о мотоцикле):
  static async searchBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.query;

      if (!query || String(query).length < 2) {
        return res.json([]);
      }

      const brands = await prisma.brand.findMany({
        where: {
          name: { contains: String(query), mode: "insensitive" },
        },
        take: 10, // Ограничиваем список для удобства
        select: { id: true, name: true },
      });

      res.json(brands);
    } catch (error) {
      next(error);
    }
  }

  //Метод получения информации о всех мотоциклах:
  static async getMotorcycles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const p = Number(page);
      const l = Number(limit);
      const searchQuery = String(search).trim();

      let ids: string[] = [];
      let totalCount = 0;

      if (searchQuery.length >= 2) {
        // 🎯 ВАЖНО: Elastic должен вернуть ID именно для ТЕКУЩЕЙ страницы
        const esResult = await searchService.searchMotorcyclesAdmin(
          searchQuery,
          p,
          l,
        );
        ids = esResult.ids;
        totalCount = esResult.total;

        if (ids.length === 0) {
          return res.json({
            data: [],
            meta: { total: 0, page: p, lastPage: 0 },
          });
        }

        // 🎯 Prisma тянет данные ТОЛЬКО по тем ID, что выдал Elastic для этой страницы
        const motorcycles = await prisma.motorcycle.findMany({
          where: { id: { in: ids } },
          include: { brand: { select: { name: true } }, images: true },
          // skip и take здесь НЕ НУЖНЫ, так как Elastic уже отфильтровал нужные 10 штук
        });

        // Сортируем результат Prisma в том порядке, в котором их вернул Elastic (по релевантности)
        const sortedMotorcycles = ids
          .map((id) => motorcycles.find((m) => m.id === id))
          .filter(Boolean);

        return res.json({
          data: sortedMotorcycles,
          meta: {
            total: totalCount,
            page: p,
            lastPage: Math.ceil(totalCount / l),
          },
        });
      }

      // Логика без поиска (обычная пагинация Prisma) остается прежней
      // ...
    } catch (error) {
      next(error);
    }
  }

  //Метод создания записи о мотоцикле:
  static async createMotorcycle(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = req.body;
      const files = req.files as Express.Multer.File[];

      //Формируем slug: соединяем модель и год
      const year = data.year || new Date().getFullYear();
      const rawSlug = `${data.model}${year}`;
      const finalSlug = slugify(rawSlug);

      // 2. Обрабатываем файлы и переименовываем их
      const imageRecords = files.map((file, index) => {
        const extension = path.extname(file.originalname); // .jpg, .png
        // Формат: slug.jpg, slug-1.jpg, slug-2.jpg
        const newFileName =
          index === 0
            ? `${finalSlug}${extension}`
            : `${finalSlug}-${index}${extension}`;

        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), newFileName);

        // Физически переименовываем файл на диске
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }

        return {
          url: newFileName, // Сохраняем красивое имя в БД
          isMain: index === 0,
        };
      });

      const motorcycle = await prisma.motorcycle.create({
        data: {
          ...data,
          // Гарантируем, что числовые поля записаны как числа
          slug: finalSlug,
          price: Number(data.price) || 300000,
          year: Number(data.year) || new Date().getFullYear(),
          displacement: data.displacement ? Number(data.displacement) : null,
          power: data.power ? Number(data.power) : null,
          topSpeed: data.topSpeed ? Number(data.topSpeed) : null,
          fuelConsumption: data.fuelConsumption
            ? Number(data.fuelConsumption)
            : null,
          rating: 0,
          colors: Array.isArray(data.colors) ? data.colors : [],
          images: {
            create: imageRecords,
          },
        },
      });
      res.status(201).json(motorcycle);
    } catch (error) {
      next(error);
    }
  }

  //Метод изменения записи о мотоцикле:
  static async updateMotorcycle(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const {
        id: _, // Извлекаем лишнее
        brand, // Извлекаем лишнее
        createdAt, // Извлекаем лишнее
        updatedAt, // Извлекаем лишнее
        deletedImageIds,
        mainImageId,
        ...rawData
      } = req.body;
      const files = req.files as Express.Multer.File[];

      //Очистка данных:
      const data: any = {};
      Object.keys(rawData).forEach((key) => {
        const value = rawData[key];

        // Заменяем NaN или строку "null" на реальный null
        if (Number.isNaN(value) || value === "NaN" || value === "null") {
          data[key] = null;
        } else if (
          [
            "price",
            "year",
            "displacement",
            "power",
            "topSpeed",
            "fuelConsumption",
          ].includes(key)
        ) {
          // Принудительно конвертируем в число, если поле должно быть числом
          data[key] = value !== "" ? Number(value) : null;
        } else {
          data[key] = value;
        }
      });

      let updateData: any = { ...data };
      if (data.model || data.year) {
        // Подтягиваем текущие данные, если чего-то не хватает в запросе
        const current = await prisma.motorcycle.findUnique({ where: { id } });
        const model = data.model || current?.model;
        const year = data.year || current?.year;
        updateData.slug = slugify(`${model}${year}`);
      }

      // 1. Удаляем помеченные изображения
      if (deletedImageIds) {
        const idsArray = Array.isArray(deletedImageIds)
          ? deletedImageIds
          : [deletedImageIds];

        // Находим файлы, чтобы удалить их с диска
        const imagesToDelete = await prisma.productImage.findMany({
          where: { id: { in: idsArray } },
        });

        for (const img of imagesToDelete) {
          const filePath = path.resolve("uploads/motorcycles", img.url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await prisma.productImage.deleteMany({
          where: { id: { in: idsArray } },
        });
      }

      // 2. Обновляем статус "Главная"
      if (mainImageId) {
        await prisma.productImage.updateMany({
          where: { motorcycleId: id },
          data: { isMain: false },
        });
        await prisma.productImage.update({
          where: { id: mainImageId },
          data: { isMain: true },
        });
      }

      // Узнаем, сколько картинок СЕЙЧАС осталось в базе для этого байка,
      // чтобы продолжить нумерацию (например, начать с -3, если 3 уже есть)
      const existingImagesCount = await prisma.productImage.count({
        where: { motorcycleId: id },
      });

      // 3. Добавляем новые файлы
      const newImages = files.map((file, index) => {
        const extension = path.extname(file.originalname);
        // Формируем имя: slug-N.jpg
        const newFileName = `${updateData.slug}-${existingImagesCount + index}${extension}`;

        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), newFileName);

        // Физически переименовываем файл на диске
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }

        return {
          url: newFileName, // В базу пишем красивое имя
          isMain: false,
        };
      });

      const motorcycle = await prisma.motorcycle.update({
        where: { id },
        data: {
          ...updateData,
          price: data.price ? Number(data.price) : 0,
          year: Number(data.year) || new Date().getFullYear(),
          colors: Array.isArray(data.colors) ? data.colors : [],
          power: data.power ? Number(data.power) : null,
          topSpeed: data.topSpeed ? Number(data.topSpeed) : null,
          fuelConsumption: data.fuelConsumption
            ? Number(data.fuelConsumption)
            : null,
          rating: data.rating ? Number(data.rating) : 0,
          displacement: data.displacement
            ? Number(data.displacement)
            : undefined,
          images: { create: newImages },
        },
        include: { images: true },
      });
      res.json(motorcycle);
    } catch (error) {
      next(error);
    }
  }

  //Метод удаления записи о мотоцикле:
  static async deleteMotorcycle(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      await prisma.motorcycle.delete({ where: { id } });
      res.json({ message: "Мотоцикл удален" });
    } catch (error) {
      next(error);
    }
  }
  //---------------------?:-------------
}
