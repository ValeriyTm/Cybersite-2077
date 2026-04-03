import { Queue } from "bullmq";
import { redis } from "../../lib/redis.js";

// Создаем очередь для заказов
export const orderQueue = new Queue("order-tasks", {
  connection: redis,
});

//Функция для добавления задачи "отменить не оплаченный заказ через час":
export const addOrderExpirationTask = async (orderId: string) => {
  await orderQueue.add(
    "expire-order",
    { orderId },
    { delay: 1000 * 60 * 60 }, //1 час в миллисекундах
  );
};
