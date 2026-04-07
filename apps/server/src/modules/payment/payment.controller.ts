import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";

export class PaymentController {
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = req.body;

      // 🎯 1. Проверяем тип события
      // ЮKassa присылает 'notification' с объектом 'object' внутри
      if (notification.event === "payment.succeeded") {
        const payment = notification.object;
        const orderId = payment.metadata.orderId; // Тот самый ID, который мы заложили при создании

        console.log(`💰 Платеж подтвержден для заказа: ${orderId}`);

        // 🎯 2. Обновляем статус заказа в БД
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.update({
            where: { id: orderId },
            data: {
              status: "PAID", // Заказ оплачен
              paymentStatus: "succeeded",
            },
            include: { items: true },
          });

          // 🎯 3. Окончательно списываем товар со склада
          // Переносим количество из reserved в физическое списание
          for (const item of order.items) {
            await tx.stock.update({
              where: {
                motorcycleId_warehouseId: {
                  motorcycleId: item.motorcycleId,
                  warehouseId: order.warehouseId,
                },
              },
              data: {
                reserved: { decrement: item.quantity },
                quantity: { decrement: item.quantity },
              },
            });
          }
        });
      }

      // 🎯 4. ОБЯЗАТЕЛЬНО отвечаем ЮKassa статусом 200
      // Иначе она будет слать уведомление снова и снова 24 часа
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook Error:", error);
      // Даже при ошибке лучше вернуть 200 или 400, чтобы ЮKassa не зациклилась
      res.status(400).send("Error");
    }
  }
}
