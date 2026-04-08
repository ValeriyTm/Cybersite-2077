import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";

export class PaymentController {
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = req.body;

      //1) Проверяем тип события
      if (notification.event === "payment.succeeded") {
        // ЮKassa присылает 'notification' с объектом 'object' внутри
        const payment = notification.object;
        const orderId = payment.metadata.orderId; //ID, который заложили при создании заказа:

        console.log(`Платеж подтвержден для заказа: ${orderId}`);

        //2) Обновляем статус заказа в БД
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.update({
            where: { id: orderId },
            data: {
              status: "PAID", //Меняем статус заказа на "оплачен"
              paymentStatus: "succeeded", //Меняем статус оплаты на "оплачен"
            },
            include: { items: true },
          });

          //3) Окончательно списываем товар со склада:
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

          //Создаём событие для оповещения в ТГ:
          eventBus.emit(EVENTS.ORDER_PAID, order);
        });
      }

      //Обязательно отвечаем ЮKassa статусом 200, иначе она будет слать уведомления в течение 24 часов:
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook Error:", error);
      //Даже при ошибке лучше вернуть 200 или 400, чтобы ЮKassa не зациклилась:
      res.status(400).send("Error");
    }
  }
}
