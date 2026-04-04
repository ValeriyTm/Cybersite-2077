import { Worker } from "bullmq";
import { redis } from "src/lib/redis.js";
import { prisma } from "@repo/database";
import { addDeliveredTask } from "./order.queue.js";

export const orderWorker = new Worker(
  "order-tasks", // Должно совпадать с именем в Queue
  async (job) => {
    const { orderId } = job.data;

    // 1. Если это задача ОТМЕНЫ НЕОПЛАЧЕННОГО заказа
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
        console.log(
          `✅ Заказ №${order.orderNumber} автоматически отменен (истекло время)`,
        );
      }
    }

    // 2. Если это задача НАЧАЛА ДОСТАВКИ (через 1-2 часа после оплаты)
    if (job.name === "start-delivery") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERY" },
      });

      //ЦЕПОЧКА: Как только поехала доставка, планируем её завершение
      await addDeliveredTask(order.id, order.estimatedDate);

      console.log(`🚚 Заказ ${orderId} переведен в статус ДОСТАВКА`);
    }

    //ПРИБЫТИЕ ТОВАРА
    if (job.name === "set-delivered") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });
      console.log(`✨ Заказ ${orderId} прибыл в пункт назначения!`);
    }
  },
  { connection: redis },
);

// Обработка ошибок воркера
orderWorker.on("failed", (job, err) => {
  console.error(`❌ Ошибка в задаче ${job?.id}: ${err.message}`);
});
