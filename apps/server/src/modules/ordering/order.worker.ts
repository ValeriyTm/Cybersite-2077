import { Worker } from "bullmq";
import { redis } from "src/lib/redis.js";
import { prisma } from "@repo/database";

export const orderWorker = new Worker(
  "order-tasks", // Должно совпадать с именем в Queue
  async (job) => {
    const { orderId } = job.data;

    //1. Ищем заказ в БД
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    //2. Если заказ уже оплачен или отменен — ничего не делаем
    if (!order || order.status !== "PENDING") {
      return;
    }

    console.log(
      `⏳ Время истекло для заказа №${order.orderNumber}. Отменяем...`,
    );

    //3. Транзакция: Меняем статус и возвращаем РЕЗЕРВ
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
          data: {
            reserved: { decrement: item.quantity }, // Уменьшаем резерв обратно 🛡️
          },
        });
      }
    });
  },
  { connection: redis },
);

// Обработка ошибок воркера
orderWorker.on("failed", (job, err) => {
  console.error(`❌ Ошибка в задаче ${job?.id}: ${err.message}`);
});
