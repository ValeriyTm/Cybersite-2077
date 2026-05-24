//Воркер:
import { Worker } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../../shared/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
import { logger } from "../../../shared/lib/logger.js";

export const cleanupWorker = new Worker(
  "cleanup-queue",
  async (job) => {
    if (job.name === "delete-unactivated") {
      const aWeekAgo = new Date();
      aWeekAgo.setDate(aWeekAgo.getDate() - 7);

      const result = await prisma.user.deleteMany({
        where: {
          isActivated: false,
          createdAt: { lt: aWeekAgo },
        },
      });

      return { type: "users", count: result.count };
    } else if (job.name === "delete-expired-tokens") {
      const anHourAgo = new Date();
      anHourAgo.setHours(anHourAgo.getHours() - 1);

      const result = await prisma.token.deleteMany({
        where: {
          isRevoked: true,
          revokedAt: { lt: anHourAgo },
        },
      });

      return { type: "tokens", count: result.count };
    }
  },
  { connection: redis },
);

cleanupWorker.on("completed", (_job, result) => {
  if (result && result.count > 0) {
    if (result.type === "users") {
      logger.info(
        `[Cleanup] Удалено неактивированных аккаунтов: ${result.count}`,
      );
    }
    if (result.type === "tokens") {
      logger.info(
        `[Cleanup] Удалено протухших отозванных сессий (токенов): ${result.count}`,
      );
    }
  }
});
