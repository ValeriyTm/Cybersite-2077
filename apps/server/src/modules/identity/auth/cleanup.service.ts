//---------Сервис для удаления из БД неподтвержденных аккаунтов, которые были созданы более 7 дней назад:
//Библиотека, позволяющая планировать выполнение задач по расписанию внутри приложения:
import cron from "node-cron";
//Клиент призмы:
import { prisma } from "@repo/database";

export class CleanupService {
  //Действия:
  static async deleteUnactivatedAccounts() {
    //Устанавливаем срок удаления в 7 дней:
    const aWeekAgo = new Date();
    aWeekAgo.setDate(aWeekAgo.getDate() - 7);

    // Находим всех, кто не активирован и создан более 7 дней назад:
    return prisma.user.deleteMany({
      where: {
        isActivated: false,
        createdAt: {
          lt: aWeekAgo,
        },
      },
    });
  }

  //Запуск сервиса:
  static init() {
    // Запуск в 00:00 каждую ночь:
    cron.schedule("0 0 * * *", async () => {
      console.log("--- Запуск очистки неподтвержденных аккаунтов ---");
      try {
        const result = await this.deleteUnactivatedAccounts();
        if (result.count > 0)
          console.log(`Удалено неподтвержденных аккаунтов: ${result.count}`);
      } catch (error) {
        console.error(error);
      }
    });
  }
}
