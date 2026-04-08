import { Telegraf } from "telegraf";
import { prisma } from "@repo/database";

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
}
