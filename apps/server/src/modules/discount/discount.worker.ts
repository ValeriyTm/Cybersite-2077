import { Worker } from "bullmq";
import { redis } from "src/lib/redis.js";
import { DiscountService } from "./discount.service.js";

const discountService = new DiscountService();

export const discountWorker = new Worker(
  "discount-tasks",
  async (job) => {
    switch (job.name) {
      case "daily-global-sale":
        await discountService.generateGlobalDiscount();
        break;

      case "daily-personal-sale":
        await discountService.generatePersonalDiscounts();
        break;

      case "weekly-promo-gen":
        await discountService.generateWeeklyPromos();
        break;
    }
  },
  { connection: redis },
);

discountWorker.on("completed", (job) => {
  console.log(`Задача ${job.name} успешно выполнена`);
});
