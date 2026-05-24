//Воркер:
import { Worker } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Очередь для изменения статусов заказов:
import { addDeliveredTask } from "./order.queue.js";
//Для генерации событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Поисковый сервис модуля Catalog:
import { searchService } from "../catalog/index.js";
//Логирование:
import { logger } from "../../shared/lib/logger.js";

export const orderWorker = new Worker(
  "order-tasks", //(Поле должно совпадать с именем в Queue)
  async (job) => {
    const { orderId } = job.data;

    //Если это задача отмены неоплаченного за час заказа:
    if (job.name === "expire-order") {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (order && order.status === "PENDING") {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELED" },
          });
          for (const item of order.items) {
            await tx.stock.update({
              where: {
                motorcycleId_warehouseId: {
                  motorcycleId: item.motorcycleId,
                  warehouseId: order.warehouseId,
                },
              },
              data: { reserved: { decrement: item.quantity } },
            });
          }
        });

        //Обновляем остатки в Elastic:
        try {
          for (const item of order.items) {
            await searchService.updateStockInElastic(item.motorcycleId);
          }
          logger.info(
            `Остатки заказа №${order.orderNumber} возвращены в Elastic (отмена)`,
          );
        } catch (error) {
          logger.error("Ошибка обновления Elastic при отмене заказа:", error);
        }

        logger.info(
          `Заказ №${order.orderNumber} автоматически отменен (истекло время)`,
        );
      }
    }

    //Если это задача начала доставки (перевод PAID- -> DELIVERY) (через 2-3 часа после оплаты)
    if (job.name === "start-delivery") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERY" },
      });

      //Как только начадась доставка, сразу планируем её завершение:
      await addDeliveredTask(order.id, order.estimatedDate);

      logger.info(`Заказ ${orderId} переведен в статус ДОСТАВКА`);
    }

    //Задача завершения доставки (перевод DELIVERY --> DELIVERED):
    if (job.name === "set-delivered") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });
      logger.info(`Заказ ${orderId} прибыл в пункт назначения!`);

      //Генерируем событие для отправки юзеру письма, что заказ доставлен:
      eventBus.emit(EVENTS.ORDER_DELIVERY_END, order);
    }

    //Задача обновления остатко в Elasticsearch:
    if (job.name === "sync-elastic-stocks") {
      const { motorcycleIds } = job.data as { motorcycleIds: string[] };

      // Вызываем новый пакетный метод (Bulk) вместо цикла
      await searchService.updateStocksInElasticBulk(motorcycleIds);

      logger.info(
        `[Worker] Успешно синхронизировано товаров в Elastic: ${motorcycleIds.length}`,
      );
    }
  },
  { connection: redis }, //Указываем воркеру, к какому именно экземпляру Redis ему нужно
  //подключиться, чтобы «слушать» задачи.
);

//Обработка ошибок воркера:
orderWorker.on("failed", (job, err) => {
  logger.error(`Ошибка в задаче ${job?.id}: ${err.message}`);
});
