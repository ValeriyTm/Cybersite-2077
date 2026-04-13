//Воркер:
import { Worker } from "bullmq";
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "src/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Очередь для изменения статусов заказов:
import { addDeliveredTask } from "./order.queue.js";
//Для генерации событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";

//???????
import { searchService } from "../catalog/search.service.js";

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
          console.log(
            `✅ Остатки заказа №${order.orderNumber} возвращены в Elastic (отмена)`,
          );
        } catch (error) {
          console.error(
            "⚠️ Ошибка обновления Elastic при отмене заказа:",
            error,
          );
        }

        console.log(
          `✅ Заказ №${order.orderNumber} автоматически отменен (истекло время)`,
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

      console.log(`🚚 Заказ ${orderId} переведен в статус ДОСТАВКА`);
    }

    //Задача завершения доставки (перевод DELIVERY --> DELIVERED):
    if (job.name === "set-delivered") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
        include: { user: true }, //Извлекаем данные о юзере
      });
      console.log(`✨ Заказ ${orderId} прибыл в пункт назначения!`);

      //Генерируем событие для отправки юзеру письма, что заказ доставлен:
      eventBus.emit(EVENTS.ORDER_DELIVERY_END, order);
    }
  },
  { connection: redis },
);

//Обработка ошибок воркера:
orderWorker.on("failed", (job, err) => {
  console.error(`❌ Ошибка в задаче ${job?.id}: ${err.message}`);
});
