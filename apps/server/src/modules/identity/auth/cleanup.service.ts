//---------Сервис для удаления из БД неподтвержденных аккаунтов, которые были созданы более 7 дней назад:
//Библиотека, позволяющая планировать выполнение задач по расписанию внутри приложения:
import cron from "node-cron";
//Клиент призмы:
import { prisma } from "@repo/database";

export class CleanupService {
  static init() {
    // Запуск в 00:00 каждую ночь:
    cron.schedule("0 0 * * *", async () => {
      console.log("--- Запуск очистки неподтвержденных аккаунтов ---");

      //Устанавливаем срок удаления в 7 дней:
      const aWeekAgo = new Date();
      aWeekAgo.setDate(aWeekAgo.getDate() - 7);

      try {
        // Находим всех, кто не активирован и создан более 7 дней назад
        const expiredUsers = await prisma.user.deleteMany({
          where: {
            isActivated: false,
            createdAt: {
              lt: aWeekAgo,
            },
          },
        });

        if (expiredUsers.count > 0) {
          console.log(`Удалено ${expiredUsers.count} просроченных аккаунтов.`);
        }
      } catch (error) {
        console.error("Ошибка при очистке аккаунтов:", error);
      }
    });
  }
}
