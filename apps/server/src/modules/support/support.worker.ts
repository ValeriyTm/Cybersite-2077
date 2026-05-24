//Воркер:
import { Worker } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Для работы с путями и файлами:
import fs from "fs/promises";
import path from "path";
//Логирование:
import { logger } from "../../shared/lib/logger.js";

interface ErrorType {
  message?: string;
}

export const supportCleanupWorker = new Worker(
  "support-cleanup", //Имя отслеживаемой очереди
  async (job) => {
    //1) Извлекаем значение ticketId из задачи:
    const { ticketId } = job.data;

    //3) Ищем тикет в PostgreSQL:
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { attachments: true },
    });

    if (!ticket) return;

    //4) Физическое удаление файлов с диска:
    // Создаем массив промисов для удаления файлов
    const deletePromises = ticket.attachments.map(async (file) => {
      const filePath = path.resolve(file.fileUrl);
      try {
        // Проверяем доступность файла асинхронно
        await fs.access(filePath);
        // Удаляем файл асинхронно:
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await fs.unlink(filePath);
      } catch (err: unknown) {
        const error = err as ErrorType;
        // Если файла нет или ошибка доступа — просто логируем,
        // чтобы не прерывать удаление остальных файлов
        logger.error(`Не удалось удалить файл ${filePath}:`, error.message);
      }
    });
    // Ждем завершения всех операций удаления
    await Promise.all(deletePromises);

    //5) Удаление сопутствующих записей из БД:
    await prisma.supportAttachment.deleteMany({
      where: { ticketId },
    });

    logger.info(`Очистка файлов для тикета ${ticketId} завершена!`);
  },
  { connection: redis },
);
