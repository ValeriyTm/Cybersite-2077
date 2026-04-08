import { Worker } from "bullmq";
import { redis } from "src/lib/redis.js";
import { ReportsService } from "./reports.service.js";
import { ExcelService } from "./excel.service.js";
import { TelegramService } from "../notifications/telegram.service.js";
import { PdfService } from "./pdf.service.js";
import fs from "fs";

export const reportsWorker = new Worker(
  "reports-queue",
  async (job) => {
    if (job.name === "weekly-excel-report") {
      // 1. Собираем статистику за неделю
      const stats = await ReportsService.getStatistics(7);

      // 2. Генерируем файл
      const filePath = await ExcelService.generateSalesRepo(stats);

      // 3. Отправляем в Telegram
      // В Telegraf метод sendDocument позволяет отправить файл
      // Нам нужно добавить этот метод в наш TelegramService (ниже покажу как)
      await TelegramService.sendDocument(
        filePath,
        `📊 Еженедельный отчет готов!\nВыручка: ${stats.totalRevenue.toLocaleString()} ₽`,
      );

      // 4. Удаляем временный файл после отправки
      fs.unlinkSync(filePath);
    }

    if (job.name === "weekly-excel-report") {
      const stats = await ReportsService.getStatistics(7);

      // Генерируем оба формата
      const excelPath = await ExcelService.generateSalesRepo(stats);
      const pdfPath = await PdfService.generateSalesPdf(stats);

      // Отправляем оба файла в Telegram
      await TelegramService.sendDocument(excelPath, `📊 Excel: Итоги недели`);
      await TelegramService.sendDocument(
        pdfPath,
        `📄 PDF: Аналитика за неделю`,
      );

      // Чистим временные файлы
      fs.unlinkSync(excelPath);
      fs.unlinkSync(pdfPath);
    }

    //Ежедневный отчет в ТГ за вчера:
    if (job.name === "daily-status-report") {
      const stats = await ReportsService.getStatistics(1); // За 1 день

      const message = `
📊 <b>ИТОГИ ЗА ВЧЕРА</b>
————————————————
💰 <b>Выручка:</b> ${stats.totalRevenue.toLocaleString()} ₽
🛒 <b>Заказов:</b> ${stats.ordersCount} шт.
🏍️ <b>Лидер дня:</b> ${stats.topSellers[0]?.model || "нет продаж"}
————————————————
<i>Склад: ${stats.lowStock.length} позиций требуют внимания!</i>
    `;

      await TelegramService.sendMessage(message);
    }
  },
  { connection: redis },
);
