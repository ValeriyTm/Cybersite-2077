//---------Сервис для удаления из БД неподтвержденных аккаунтов, которые были созданы более 7 дней назад:
//Очередь:
import { Queue } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "src/lib/redis.js";

const cleanupQueue = new Queue("cleanup-queue", { connection: redis });

export class CleanupService {
  static async init() {
    //Добавляем повторяющуюся задачу:
    await cleanupQueue.add(
      "delete-unactivated",
      {},
      {
        repeat: {
          pattern: "0 0 * * *", //Запуск каждую ночь в 00:00
        },
        jobId: "daily-cleanup",
      },
    );
    console.log(
      "🧹 Cleanup Service (BullMQ): Scheduled daily task initialized",
    );
  }
}
