import { Worker } from "bullmq";
import { prisma } from "@repo/database";
import { redis } from "src/lib/redis.js";

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

      return result.count;
    }
  },
  { connection: redis },
);

// Логирование (опционально)
cleanupWorker.on("completed", (job, result) => {
  if (result > 0) console.log(`[Cleanup] Удалено аккаунтов: ${result}`);
});
