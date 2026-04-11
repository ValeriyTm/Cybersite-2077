//Этот контроллер будет отвечать за получение списков с пагинацией и поиском.

import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { ReportsService } from "../reports/reports.service.js";
import { PdfService } from "../reports/pdf.service.js";
import { ExcelService } from "../reports/excel.service.js";
import { searchService } from "../catalog/search.service.js";
import fs from "fs";
import path from "path";
import { esClient } from "../catalog/search.service.js";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

export class AdminController {
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
      // Находим все связанные байки ПЕРЕД удалением
      const affectedMotos = await prisma.motorcycle.findMany({
        where: { brandId: id },
        select: { id: true },
      });

      await prisma.brand.delete({ where: { id } });

      // 🎯 После удаления бренда и байков (каскадно) — чистим индекс Elastic
      const deletePromises = affectedMotos.map((m) =>
        searchService.deleteFromIndex(m.id),
      );
      await Promise.all(deletePromises);

      res.json({ message: "Бренд и связанные товары удалены из БД и индекса" });
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

      // При создании нового бренда мотоциклов еще нет,
      // поэтому синхронизация не требуется, пока не создадут первый байк.
      res.status(201).json(brand);
    } catch (error) {
      next(error);
    }
  }

  //Метод для изменения информации о бренде:
  static async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const oldBrand = await prisma.brand.findUnique({ where: { id } });
      const { name, country, slug } = req.body;
      const updatedBrand = await prisma.brand.update({
        where: { id },
        data: { name, country, slug },
      });

      // 🎯 Если изменился slug или name — синхронизируем все байки этого бренда в Elastic
      if (
        oldBrand?.slug !== updatedBrand.slug ||
        oldBrand?.name !== updatedBrand.name
      ) {
        // Запускаем в фоне, чтобы не заставлять админа ждать окончания индексации всех байков
        searchService
          .syncBrandMotorcycles(id)
          .catch((err) =>
            console.error(`Ошибка синхронизации бренда ${id} в ES:`, err),
          );
      }

      // 🎯 СИНХРОНИЗАЦИЯ: Обновляем все байки этого бренда в Elastic
      // const affectedMotos = await prisma.motorcycle.findMany({
      //   where: { brandId: id },
      // });

      // // Делаем это асинхронно через Promise.all, чтобы не тормозить ответ админу
      // await Promise.all(
      //   affectedMotos.map((m) => searchService.indexMotorcycle(m.id)),
      // );
      res.json(updatedBrand);
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

      //Обновление данных в Elasticsearch:
      await searchService.indexMotorcycle(motorcycle.id);
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

      //СИНХРОНИЗАЦИЯ: Обновляем данные в Elastic
      await searchService.indexMotorcycle(id);
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

      //СИНХРОНИЗАЦИЯ: Удаляем из Elastic
      await searchService.deleteFromIndex(id);
      res.json({ message: "Мотоцикл удален" });
    } catch (error) {
      next(error);
    }
  }
  //---------------------Работа с остатками:-------------
  // 1. Получение всех остатков
  static async getStocks(req: Request, res: Response, next: NextFunction) {
    try {
      const { motoId } = req.query; // Получаем ID из query-параметра

      const stocks = await prisma.stock.findMany({
        where: {
          motorcycleId: motoId ? String(motoId) : undefined,
        },
        include: {
          motorcycle: { select: { model: true } },
          warehouse: { select: { name: true, city: true } },
        },
        orderBy: { warehouse: { name: "asc" } },
      });

      res.json({ data: stocks });
    } catch (e) {
      next(e);
    }
  }

  // 2. Быстрое обновление количества
  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const stock = await prisma.stock.update({
        where: { id },
        data: {
          // 🎯 Принудительно приводим к числу и проверяем на валидность
          quantity: !isNaN(Number(quantity)) ? Number(quantity) : 0,
        },
        select: { motorcycleId: true },
      });

      //Обновление инфы в Elasticsearch:
      searchService.updateStockInElastic(stock.motorcycleId).catch((err) => {
        console.error(
          `Ошибка синхронизации остатков для байка ${stock.motorcycleId}:`,
          err,
        );
      });

      res.json(stock);
    } catch (e) {
      next(e);
    }
  }

  //---------------------Работа с заказами:-------------
  //Получить все заказы:
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, status, email } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // 🎯 Формируем фильтры
      const where: any = {};
      if (status) where.status = status;
      if (email) {
        where.user = {
          email: { contains: String(email), mode: "insensitive" },
        };
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
            items: {
              include: {
                motorcycle: { select: { model: true } },
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        data: orders,
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

  //Изменить статус заказа:
  static async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await prisma.order.update({
        where: { id },
        data: { status },
      });

      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  //---------------------Управление доступом:-------------
  //Получить роль юзера:
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, role, email } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (role) where.role = role;
      if (email) where.email = { contains: String(email), mode: "insensitive" };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            // 🎯 Не берем пароли и секреты
            id: true,
            email: true,
            name: true,
            phone: true,
            isActivated: true,
            role: true,
            createdAt: true,
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        data: users,
        meta: { total, lastPage: Math.ceil(total / Number(limit)) },
      });
    } catch (error) {
      next(error);
    }
  }

  //Изменить роль юзеру:
  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = (req as any).user.id; // ID текущего админа из мидлвара

      // 🎯 Защита: нельзя менять роль самому себе
      if (id === adminId) {
        return res
          .status(403)
          .json({ message: "Вы не можете изменить роль самому себе" });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
      });
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  //Удалить юзера:
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      if (id === adminId) {
        return res.status(403).json({
          message: "Вы не можете удалить свою собственную учетную запись",
        });
      }

      await prisma.user.delete({ where: { id } });
      res.json({ message: "Пользователь успешно удален" });
    } catch (error) {
      next(error);
    }
  }
  //---------------------Глобальная синхронизация:-------------
  //Синхронизируем всю БД с Elasticsearch:
  static async globalSearchSync(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // 1. Очищаем индекс в Elasticsearch

      //Используем адрес  контейнера Elasticsearch
      const esUrl = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
      await fetch(`${esUrl}/motorcycles`, {
        method: "DELETE",
      });

      // 2. Вызываем твою существующую логику пересоздания индекса и заливки данных
      // Предположим, твой метод sync-search вызывает searchService.reindexAll()
      await searchService.syncAllMotorcycles();

      res.json({ message: "Глобальная синхронизация успешно завершена" });
    } catch (error) {
      next(error);
    }
  }
  //---------------------Скидки и промокоды:-------------
  //Получаем промокоды:
  static async getPromoCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const promos = await prisma.promoCode.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      res.json(promos);
    } catch (e) {
      next(e);
    }
  }

  //Поулчаем персональные скидки:
  static async getPersonalDiscounts(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { email } = req.query;

      const discounts = await prisma.personalDiscount.findMany({
        where: email
          ? {
              user: {
                email: { contains: String(email), mode: "insensitive" }, // Поиск без учета регистра
              },
            }
          : {},
        include: {
          user: { select: { email: true } },
          motorcycle: { select: { model: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(discounts);
    } catch (e) {
      next(e);
    }
  }
  //---------------------Отчеты:-------------
  //Скачать отчеты:
  static async downloadSalesReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      console.log("req.query: ", req.query);
      const { format, days = 30 } = req.query; // Получаем формат (pdf/xlsx) и период
      console.log("Запрошенный формат:", format);
      const stats = await ReportsService.getStatistics(Number(days));

      if (format === "xlsx") {
        const filePath = await ExcelService.generateSalesRepo(stats);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        return res.download(filePath, (err) => {
          if (err) console.error("Ошибка при отправке Excel:", err);
          // Удаляем временный файл после отправки, если нужно
          // fs.unlinkSync(filePath);
        });
      }

      if (format === "pdf") {
        const filePath = await PdfService.generateSalesPdf(stats);
        res.contentType("application/pdf");
        return res.sendFile(filePath);
      }

      res.status(400).json({ message: "Неверный формат отчета" });
    } catch (error) {
      next(error);
    }
  }

  //---------------------Тикеты поддержки:-------------
  //Получение всех тикетов:
  static async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, email } = req.query;

      const where: any = {};
      if (status) where.status = status;
      if (email) {
        where.email = { contains: String(email), mode: "insensitive" };
      }

      const tickets = await prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { email: true, name: true } },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(tickets);
    } catch (e) {
      next(e);
    }
  }

  //Дать ответ на тикет:
  static async replyToTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: {
          answer,
          status: "RESOLVED", // Переводим в RESOLVED по твоей схеме
          answeredAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.json(ticket);
    } catch (e) {
      next(e);
    }
  }

  //Изменить статус тикета:
  static async updateTicketStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: { status },
      });

      res.json(ticket);
    } catch (e) {
      next(e);
    }
  }
}
