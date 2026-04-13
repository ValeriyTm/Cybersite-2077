//Воркер:
import { Worker } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "src/lib/redis.js";
//Основной сервис модуля Reports:
import { reportsService } from "./reports.service.js";
//Прочие сервисы модуля Reports:
import { excelService } from "./excel.service.js";
import { pdfService } from "./pdf.service.js";
//Для взаимодействия с файлами:
import fs from "fs";
//Сервис для отправки сообщений в Telegram из модуля Notifications:
import { telegramService } from "../notifications/index.js";

export const reportsWorker = new Worker(
  "reports-queue",
  async (job) => {
    if (job.name === "weekly-excel-report") {
      // 1. Собираем статистику за неделю
      const stats = await reportsService.getStatistics(7);

      // 2. Генерируем файл
      const filePath = await excelService.generateSalesRepo(stats);

      // 3. Отправляем в Telegram
      await telegramService.sendDocument(
        filePath,
        `📊 Еженедельный отчет готов!\nВыручка: ${stats.totalRevenue.toLocaleString()} ₽`,
      );

      // 4. Удаляем временный файл после отправки
      fs.unlinkSync(filePath);
    }

    if (job.name === "weekly-excel-report") {
      const stats = await reportsService.getStatistics(7);

      // Генерируем оба формата
      const excelPath = await excelService.generateSalesRepo(stats);
      const pdfPath = await pdfService.generateSalesPdf(stats);

      // Отправляем оба файла в Telegram
      await telegramService.sendDocument(excelPath, `📊 Excel: Итоги недели`);
      await telegramService.sendDocument(
        pdfPath,
        `📄 PDF: Аналитика за неделю`,
      );

      // Чистим временные файлы
      fs.unlinkSync(excelPath);
      fs.unlinkSync(pdfPath);
    }

    //Ежедневный отчет в ТГ за вчера:
    if (job.name === "daily-status-report") {
      const stats = await reportsService.getStatistics(1); // За 1 день

      const message = `
📊 <b>ИТОГИ ЗА ВЧЕРА</b>
————————————————
💰 <b>Выручка:</b> ${stats.totalRevenue.toLocaleString()} ₽
🛒 <b>Заказов:</b> ${stats.ordersCount} шт.
🏍️ <b>Лидер дня:</b> ${stats.topSellers[0]?.model || "нет продаж"}
————————————————
<i>Склад: ${stats.lowStock.length} позиций требуют внимания!</i>
    `;

      await telegramService.sendMessage(message);
    }
  },
  { connection: redis },
);
