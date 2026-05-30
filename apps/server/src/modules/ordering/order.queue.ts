//Очередь:
import { ConnectionOptions, Queue } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Логирование:
import { logger } from "../../shared/lib/logger.js";

// Создаем очередь для заказов
export const orderQueue = new Queue("order-tasks", {
  connection: redis as unknown as ConnectionOptions,
});

//Функция для добавления задачи "отменить не оплаченный заказ через час":
export const addOrderExpirationTask = async (orderId: string) => {
  await orderQueue.add(
    "expire-order",
    { orderId },
    { delay: 1000 * 60 * 60 }, //1 час
  );
};

//Функция для перевода заказа из статуса PAID в DELIVERY:
export const addDeliveryStartTask = async (orderId: string) => {
  //Для тестов: const randomDelay = 1000 * 30;
  const randomDelay =
    Math.floor(Math.random() * (180 - 120 + 1) + 120) * 60 * 1000; //Перевод через 2-3 часа рандомно

  await orderQueue.add("start-delivery", { orderId }, { delay: randomDelay });

  logger.info(
    `Задача на доставку для ${orderId} запланирована через ${randomDelay / 60000} мин.`,
  );
};

//Функция для перевода заказа в статус DELIVERED:
export const addDeliveredTask = async (
  orderId: string,
  estimatedDate: Date,
) => {
  const now = new Date().getTime();
  const deliveryTime = new Date(estimatedDate).getTime();

  //Вычисляем задержку (сколько миллисекунд осталось до даты доставки):
  const delay = Math.max(0, deliveryTime - now);
  //Для тестов: const delay = 1000 * 30;

  await orderQueue.add("set-delivered", { orderId }, { delay });

  logger.info(
    `Заказ ${orderId} будет помечен как DELIVERED через ${Math.round(delay / 1000 / 60)} мин.`,
  );
};

// Функция для добавления задачи обновления остатков в Elastic:
export const addElasticSyncTask = async (motorcycleIds: string[]) => {
  await orderQueue.add(
    "sync-elastic-stocks",
    { motorcycleIds },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  );
  logger.info(
    `Задача на синхронизацию ${motorcycleIds.length} товаров в Elastic добавлена в очередь.`,
  );
};
