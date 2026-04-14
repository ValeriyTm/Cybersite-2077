//Очередь:
import { Queue } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "src/shared/lib/redis.js";

export const discountQueue = new Queue("discount-tasks", {
  connection: redis,
});

//Инициализируем повторяющиеся задачи:
export const initDiscountCron = async () => {
  //1. Глобальная скидка (каждый день в 00:00)
  await discountQueue.add(
    "daily-global-sale",
    {},
    {
      repeat: { pattern: "0 0 * * *" },
    },
  );
  ////(Каждое утро в Redis появляется новый год изготовления для выбора байков для скидки)

  //2. Персональная скидка (каждый день в 09:00):
  await discountQueue.add(
    "daily-personal-sale",
    {},
    {
      repeat: { pattern: "0 9 * * *" },
    },
  );
  ////(Система сама выбирает байк для каждого юзера, записывает в Postgres и шлет письмо с пересчитанной ценой)

  //3. Промокоды (каждую неделю - в воскресенье в 23:59):
  await discountQueue.add(
    "weekly-promo-gen",
    {},
    {
      repeat: { pattern: "59 23 * * 0" },
    },
  );
  ////(Раз в неделю база пополняется новыми секретными словами)
};
