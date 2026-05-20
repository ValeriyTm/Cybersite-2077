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
  console.log("req.body from yoo: ", req.body);
  const payment = notification.object; //ЮKassa присылает 'notification' с объектом 'object' внутри
  const orderId = payment.metadata.orderId; //ID, который заложили при создании заказа:

  if (!orderId) {
    console.error("Получен вебхук без orderId в metadata");
    return res.status(400).send("Не найден заказ");
  }

  //Проверяем тип события:
  switch (notification.event) {
    case "payment.succeeded": {
      //Событие успешного платежа

      //Обновляем статус заказа и остатки в БД (а также проверяем заказ, чтобы не дублировалась оплата):
      const result = await paymentService.applyChangeAfterPayment(orderId);

      if (result.alreadyProcessed) {
        console.log(
          `Заказ ${orderId} уже был обработан ранее или не существует.`,
        );
        return res.status(200).send("OK");
      }

      console.log(`Платеж подтвержден для заказа: ${orderId}`);
      const { order } = result;

      //Обновляем данные по остаткам в Elastic:
      try {
        for (const item of order!.items) {
          await searchService.updateStockInElastic(item.motorcycleId);
        }
        console.log(
          `Остатки после оплаты заказа №${order!.orderNumber} синхронизированы с Elastic`,
        );
      } catch (error) {
        console.error("Ошибка синхронизации с Elastic при оплате:", error);
      }

      //Запускаем BullMQ на доставку:
      await addDeliveryStartTask(order!.id);

      //Создаём событие для оповещения в ТГ:
      eventBus.emit(EVENTS.ORDER_PAID, order);

      console.log(
        `Оплата для заказа №${order!.orderNumber} прошла, остатки списаны, доставка запланирована!`,
      );
      break;
    }
    case "payment.canceled": {
      //Событие отмены платежа

      if (!orderId) {
        console.error("Получен вебхук payment.canceled без orderId в metadata");
        break;
      }

      console.log(
        `Платеж отменен для заказа: ${orderId}. Причина: ${payment.cancellation_details?.reason}`,
      );

      //Осуществляем отмену брони:
      const order = await paymentService.finishRefundOrCancel(orderId);

      //Синхронизация Elasticsearch:
      if (order) {
        try {
          for (const item of order.items) {
            await searchService.updateStockInElastic(item.motorcycleId);
          }
          console.log(
            `Остатки после отмены платежа для заказа №${orderId} синхронизированы с Elastic`,
          );
        } catch (error) {
          console.error(
            "Ошибка синхронизации с Elastic при отмене платежа:",
            error,
          );
        }
      }

      //Написать код:
      // eventBus.emit(EVENTS.ORDER_CANCELED, orderId);

      //Когда-нибудь добавить запись причины отмена платежа от Юкассы в БД.
      //Когда-нибудь изменить функционал, чтобы, если первый платеж отменился, то заказ не окончательно отменялся, а жил какое-тов время для возможности повторной оплаты.
      //Для настоящего приложения ещё нужно добавить проверку криптографической подписи (HMAC / Content-Signature).

      break;
    }
    case "refund.succeeded": {
      //Событие возврата

      const refund = notification.object;
      const paymentId = refund.payment_id; //ID платежа из ЮKassa (не refund.id, т.к. refund.id - это id возврата)
      const refundAmount = refund.amount.value;

      console.log(
        `ЮKassa подтвердила возврат по платежу ${paymentId} на сумму ${refundAmount}`,
      );

      //Обновляем статус заказа и осуществляем возврат товара на склад:
      const order = await paymentService.finishRefundOrCancel(orderId);

      // Синхронизируем склад с ElasticSearch:
      if (order) {
        try {
          for (const item of order.items) {
            await searchService.updateStockInElastic(item.motorcycleId);
          }
        } catch (error) {
          console.error("Ошибка синхронизации с Elastic при возврате:", error);
        }
      }

      //Написать код:
      // eventBus.emit(EVENTS.ORDER_REFUNDED, orderId);

      break;
    }
    default: {
      // Логируем на случай, если ЮKassa пришлет иное событие:
      console.log(
        `Получено необрабатываемое событие от ЮKassa: ${notification.event}`,
      );
      break;
    }
  }

  //Обязательно отвечаем ЮKassa статусом 200, иначе она будет слать уведомления в течение 24 часов:
  res.status(200).send("OK");
});
