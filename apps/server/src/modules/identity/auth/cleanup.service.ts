//---------Сервис для удаления из БД неподтвержденных аккаунтов, которые были созданы более 7 дней назад:
//Очередь:
import { ConnectionOptions, Queue } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../../shared/lib/redis.js";
import { logger } from "../../../shared/lib/logger.js";

const cleanupQueue = new Queue("cleanup-queue", {
  connection: redis as unknown as ConnectionOptions,
});

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

    await cleanupQueue.add(
      "delete-expired-tokens",
      {},
      {
        repeat: {
          pattern: "0 * * * *", // Запуск раз в час
        },
        jobId: "daily-tokens-cleanup",
        removeOnComplete: true, // Подчищаем историю выполнения в Redis
        removeOnFail: true,
      },
    );

    logger.info("🧹 Сервис очистки БД на основе BullMQ запущен");
  }
}
