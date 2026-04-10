//Этот контроллер будет отвечать за получение списков с пагинацией и поиском.

import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { ReportsService } from "../reports/reports.service.js";
import { PdfService } from "../reports/pdf.service.js";
import { ExcelService } from "../reports/excel.service.js";

export class AdminController {
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
  //---------------------?:-------------
}
