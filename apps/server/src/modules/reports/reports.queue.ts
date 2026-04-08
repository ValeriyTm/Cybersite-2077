import { Queue } from "bullmq";
import { redis } from "src/lib/redis.js";

export const reportsQueue = new Queue("reports-queue", {
  connection: redis,
});

export const initReportsSchedule = async () => {
  //1) Ежедневный краткий отчет:
  await reportsQueue.add(
    "daily-status-report",
    {},
    {
      repeat: { pattern: "0 9 * * *" }, //Каждым утром в 09:00
    },
  );

  //2) Еженедельный файл (Excel + PDF):
  await reportsQueue.add(
    "weekly-excel-report",
    {},
    {
      repeat: { pattern: "0 8 * * 1" }, //Каждый понедельник в 08:00
    },
  );

  console.log("📅 Расписание отчетов настроено");
};
