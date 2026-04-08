import { Telegraf } from "telegraf";

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

      console.log("🤖 Telegram Bot успешно инициализирован");
    }

    // TelegramService.sendMessage("🚀 Тестовое сообщение от сервера CyberSite!");
  }

  // Универсальный метод отправки сообщения админу
  static async sendMessage(message: string) {
    if (!this.bot || !this.adminId) return;

    try {
      // parse_mode: 'HTML' позволяет использовать теги <b>, <i>, <code> и т.д.
      await this.bot.telegram.sendMessage(this.adminId, message, {
        parse_mode: "HTML",
      });
    } catch (error) {
      console.error("Ошибка отправки сообщения в Telegram:", error);
    }
  }
}
