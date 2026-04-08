import { Telegraf } from "telegraf";
import { prisma } from "@repo/database";
import { ReportsService } from "../reports/reports.service.js";
import { PdfService } from "../reports/pdf.service.js";
import { ExcelService } from "../reports/excel.service.js";
import fs from "fs";

export class TelegramService {
  private static bot: Telegraf;
  private static adminId: string = process.env.TG_ADMIN_CHAT_ID || "";

  static init() {
    if (!this.bot && process.env.TG_BOT_TOKEN) {
      this.bot = new Telegraf(process.env.TG_BOT_TOKEN);

      // Запускаем бота
      this.bot
        .launch()
        .catch((err) => console.error("Ошибка запуска TG бота:", err));

      console.log("🤖Telegram Bot успешно инициализирован");

      //Через команду "/stats" в боте получим количество всех заказов:
      this.bot.command("stats", async (ctx) => {
        if (ctx.from.id.toString() !== this.adminId) return;

        const ordersCount = await prisma.order.count();
        await ctx.reply(
          `📈 Статистика магазина:\nВсего заказов: ${ordersCount}`,
        );
      });

      //Через команду "/report" получаем текущий отчет в pdf:
      this.bot.command("report", async (ctx) => {
        // Проверка на админа (как мы делали раньше)
        if (ctx.from.id.toString() !== this.adminId) return;

        await ctx.reply("⏳ Формирую отчет за последние 30 дней, подождите...");

        try {
          const stats = await ReportsService.getStatistics(30);
          const pdfPath = await PdfService.generateSalesPdf(stats);

          await ctx.replyWithDocument(
            { source: pdfPath },
            {
              caption: `📄 Месячный отчет (по запросу)\nВыручка: ${stats.totalRevenue.toLocaleString()} ₽`,
            },
          );

          fs.unlinkSync(pdfPath);
        } catch (error) {
          await ctx.reply("❌ Ошибка при генерации отчета");
          console.error(error);
        }
      });

      //Через команду "/reports-full" получаем текущий отчет в pdf и excel:
      this.bot.command("reports_full", async (ctx) => {
        if (ctx.from.id.toString() !== this.adminId) return;

        await ctx.reply(
          "🚀 Запущена генерация полного пакета отчетов (PDF + Excel)...",
        );

        try {
          // Собираем данные за последние 30 дней
          const stats = await ReportsService.getStatistics(30);

          // Генерируем оба формата
          const pdfPath = await PdfService.generateSalesPdf(stats);
          const excelPath = await ExcelService.generateSalesRepo(stats);

          // Отправляем файлы по очереди
          await ctx.replyWithDocument(
            { source: pdfPath },
            {
              caption: `📄 PDF: Полная аналитика за 30 дней`,
            },
          );

          await ctx.replyWithDocument(
            { source: excelPath },
            {
              caption: `📊 Excel: Детальная таблица за 30 дней`,
            },
          );

          // Обязательно чистим сервер от временных файлов
          fs.unlinkSync(pdfPath);
          fs.unlinkSync(excelPath);

          await ctx.reply("✅ Все файлы успешно отправлены.");
        } catch (error) {
          console.error("Ошибка команды /reports_full:", error);
          await ctx.reply("❌ Произошла ошибка при создании отчетов.");
        }
      });
    }
  }

  //Универсальный метод отправки сообщения админу:
  static async sendMessage(message: string) {
    if (!this.bot || !this.adminId) return;

    try {
      await this.bot.telegram.sendMessage(this.adminId, message, {
        parse_mode: "HTML",
        //parse_mode: 'HTML' позволяет использовать теги <b>, <i>, <code> и т.д.
      });
    } catch (error) {
      console.error("Ошибка отправки сообщения в Telegram:", error);
    }
  }

  //Метод для отправки файлов:
  static async sendDocument(filePath: string, caption: string) {
    if (!this.bot || !this.adminId) return;
    try {
      await this.bot.telegram.sendDocument(
        this.adminId,
        { source: filePath },
        { caption },
      );
    } catch (error) {
      console.error("Ошибка отправки файла в TG:", error);
    }
  }
}
