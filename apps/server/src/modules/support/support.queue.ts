import { Queue } from "bullmq";
import { redis } from "src/lib/redis.js";

export const supportCleanupQueue = new Queue("support-cleanup", {
  connection: redis,
});

//Функция для планирования удаления файлов модуля support (через 30 дней после закрытия вопроса):
export const scheduleTicketCleanup = async (ticketId: string) => {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  await supportCleanupQueue.add(
    "delete-files",
    { ticketId },
    { delay: THIRTY_DAYS, jobId: `cleanup-${ticketId}` }, // jobId предотвратит дубликаты
  );
};
