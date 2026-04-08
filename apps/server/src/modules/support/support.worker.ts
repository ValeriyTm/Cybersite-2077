import { Worker } from "bullmq";
import { redis } from "src/lib/redis.js";
import { prisma } from "@repo/database";
import fs from "fs";
import path from "path";

export const supportCleanupWorker = new Worker(
  "support-cleanup",
  async (job) => {
    const { ticketId } = job.data;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { attachments: true },
    });

    if (!ticket) return;

    // 1. Физическое удаление файлов с диска
    ticket.attachments.forEach((file) => {
      const filePath = path.resolve(file.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // 2. Удаление записей об аттачментах из БД
    await prisma.supportAttachment.deleteMany({
      where: { ticketId },
    });

    console.log(`🧹 Очистка файлов для тикета ${ticketId} завершена`);
  },
  { connection: redis },
);
