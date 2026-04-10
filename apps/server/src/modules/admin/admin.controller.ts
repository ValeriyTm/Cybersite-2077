//Этот контроллер будет отвечать за получение списков с пагинацией и поиском.

import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { ReportsService } from "../reports/reports.service.js";
import { PdfService } from "../reports/pdf.service.js";
import { ExcelService } from "../reports/excel.service.js";

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
  //Метод получения информации о всех мотоциклах:
  static async getMotorcycles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [motorcycles, total] = await Promise.all([
        prisma.motorcycle.findMany({
          where: {
            OR: [
              { model: { contains: String(search), mode: "insensitive" } },
              {
                brand: {
                  name: { contains: String(search), mode: "insensitive" },
                },
              },
            ],
          },
          include: { brand: { select: { name: true } } },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.motorcycle.count({
          where: {
            OR: [
              { model: { contains: String(search), mode: "insensitive" } },
              {
                brand: {
                  name: { contains: String(search), mode: "insensitive" },
                },
              },
            ],
          },
        }),
      ]);

      res.json({
        data: motorcycles,
        meta: { total, lastPage: Math.ceil(total / Number(limit)) },
      });
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

      // Генерируем slug из модели, если он не передан
      if (!data.slug) {
        data.slug = data.model
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "");
      }

      const motorcycle = await prisma.motorcycle.create({
        data: {
          ...data,
          // Гарантируем, что числовые поля записаны как числа
          price: Number(data.price),
          year: Number(data.year),
          displacement: Number(data.displacement),
          rating: 0,
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
      const data = req.body;

      const motorcycle = await prisma.motorcycle.update({
        where: { id },
        data: {
          ...data,
          price: data.price ? Number(data.price) : undefined,
          year: data.year ? Number(data.year) : undefined,
          displacement: data.displacement
            ? Number(data.displacement)
            : undefined,
        },
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
