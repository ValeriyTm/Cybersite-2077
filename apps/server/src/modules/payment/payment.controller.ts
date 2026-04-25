//Типы:
import { Request, Response } from "express";
//Для генерации событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Основной сервис модуля Payment:
import { paymentService } from "./payment.service.js";
//Сервис модуля Ordering:
import { searchService } from "../catalog/index.js";
//Очереди для отмены заказа / изменения статуса заказа:
import { addDeliveryStartTask } from "../ordering/index.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

export const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const notification = req.body;

  //Проверяем тип события:
  if (notification.event === "payment.succeeded") {
    const payment = notification.object; //ЮKassa присылает 'notification' с объектом 'object' внутри
    const orderId = payment.metadata.orderId; //ID, который заложили при создании заказа:

    console.log(`Платеж подтвержден для заказа: ${orderId}`);

    //Обновляем статус заказа и остатки в БД:
    const order = await paymentService.applyChangeAfterPayment(orderId);

    //Обновляем данные по остаткам в Elastic:
    try {
      for (const item of order.items) {
        await searchService.updateStockInElastic(item.motorcycleId);
      }
      console.log(
        `Остатки после оплаты заказа №${order.orderNumber} синхронизированы с Elastic`,
      );
    } catch (error) {
      console.error("Ошибка синхронизации с Elastic при оплате:", error);
    }

    //Запускаем BullMQ на доставку:
    await addDeliveryStartTask(order.id);

    //Создаём событие для оповещения в ТГ:
    eventBus.emit(EVENTS.ORDER_PAID, order);

    console.log(
      `Оплата для заказа №${order.orderNumber} прошла, остатки списаны, доставка запланирована!`,
    );
  }

  //Обязательно отвечаем ЮKassa статусом 200, иначе она будет слать уведомления в течение 24 часов:
  res.status(200).send("OK");
});
