//Воркер:
import { Worker } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Основной сервис модуля Discount:
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
