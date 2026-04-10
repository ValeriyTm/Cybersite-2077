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
}
