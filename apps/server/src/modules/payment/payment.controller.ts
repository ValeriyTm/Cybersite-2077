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
//Логирование:
import { logger } from "../../shared/lib/logger.js";

export const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const notification = req.body;

  //1. Используем Callback Verification для проверки достоверности запроса:
  const paymentId = notification.object?.id;
  if (!paymentId) {
    logger.error("Получен некорректный вебхук: отсутствует ID платежа");
    return res.status(400).send("Bad Request: Missing payment ID");
  }

  let actualPayment;
  let orderId = null;

  if (
    notification.event === "payment.succeeded" ||
    notification.event === "payment.canceled"
  ) {
    try {
      actualPayment = await paymentService.callbackVerification(paymentId);
    } catch (error) {
      logger.error(
        `Ошибка при встречном запросе платежа ${paymentId} из ЮKassa:`,
        error,
      );
      // Возвращаем 500, чтобы ЮKassa повторила попытку позже, если у них был временный сбой:
      return res.status(500).send("Internal Server Error");
    }
  }

  //2.Проверяем тип события:
  switch (notification.event) {
    case "payment.succeeded": {
      //Событие успешного платежа

      //Извлекаем orderId из метаданных реального ответа ЮKassa
      orderId = actualPayment!.metadata?.orderId;
      if (!orderId) {
        logger.error(`В платеже ${paymentId} отсутствуют метаданные orderId`);
        return res.status(200).send("OK"); // Отвечаем 200, чтобы ЮKassa не зацикливала отправку
      }

      //Обновляем статус заказа и остатки в БД (а также проверяем заказ, чтобы не дублировалась оплата):
      const result = await paymentService.applyChangeAfterPayment(orderId);

      if (result.alreadyProcessed) {
        logger.info(
          `Заказ ${orderId} уже был обработан ранее или не существует.`,
        );
        return res.status(200).send("OK");
      }

      logger.info(`Платеж подтвержден для заказа: ${orderId}`);
      const { order } = result;

      //Обновляем данные по остаткам в Elastic:
      try {
        for (const item of order!.items) {
          await searchService.updateStockInElastic(item.motorcycleId);
        }
        logger.info(
          `Остатки после оплаты заказа №${order!.orderNumber} синхронизированы с Elastic`,
        );
      } catch (error) {
        logger.error("Ошибка синхронизации с Elastic при оплате:", error);
      }

      //Запускаем BullMQ на доставку:
      await addDeliveryStartTask(order!.id);

      //Создаём событие для оповещения в ТГ:
      eventBus.emit(EVENTS.ORDER_PAID, order);

      logger.info(
        `Оплата для заказа №${order!.orderNumber} прошла, остатки списаны, доставка запланирована!`,
      );
      break;
    }
    case "payment.canceled": {
      //Событие отмены платежа

      //Извлекаем orderId из метаданных реального ответа ЮKassa
      orderId = actualPayment!.metadata?.orderId;
      if (!orderId) {
        logger.error(`В платеже ${paymentId} отсутствуют метаданные orderId`);
        return res.status(200).send("OK"); // Отвечаем 200, чтобы ЮKassa не зацикливала отправку
      }

      if (!orderId) {
        logger.error("Получен вебхук payment.canceled без orderId в metadata");
        break;
      }

      logger.info(
        `Платеж отменен для заказа: ${orderId}. Причина: ${actualPayment!.cancellation_details?.reason}`,
      );

      //Осуществляем отмену брони:
      const order = await paymentService.finishRefundOrCancel(orderId);

      //Синхронизация Elasticsearch:
      if (order) {
        try {
          for (const item of order.items) {
            await searchService.updateStockInElastic(item.motorcycleId);
          }
          logger.info(
            `Остатки после отмены платежа для заказа №${orderId} синхронизированы с Elastic`,
          );
        } catch (error) {
          logger.error(
            "Ошибка синхронизации с Elastic при отмене платежа:",
            error,
          );
        }
      }

      //Написать код:
      // eventBus.emit(EVENTS.ORDER_CANCELED, orderId);

      //Когда-нибудь добавить запись причины отмена платежа от Юкассы в БД.
      //Когда-нибудь изменить функционал, чтобы, если первый платеж отменился, то заказ не окончательно отменялся, а жил какое-тов время для возможности повторной оплаты.

      break;
    }
    case "refund.succeeded": {
      //Событие возврата

      const refund = notification.object;
      const paymentId = refund.payment_id; //ID платежа из ЮKassa (не refund.id, т.к. refund.id - это id возврата)
      const refundAmount = refund.amount.value;
      const refundOrderId = refund.metadata?.orderId;

      if (!refundOrderId) {
        logger.error(
          `В вебхуке возврата по платежу ${paymentId} отсутствует orderId в metadata`,
        );
        break;
      }

      logger.info(
        `ЮKassa подтвердила возврат по платежу ${paymentId} для заказа ${refundOrderId} на сумму ${refundAmount}`,
      );

      //Обновляем статус заказа и осуществляем возврат товара на склад:
      const order = await paymentService.finishRefundOrCancel(refundOrderId);

      // Синхронизируем склад с ElasticSearch:
      if (order) {
        try {
          for (const item of order.items) {
            await searchService.updateStockInElastic(item.motorcycleId);
          }
        } catch (error) {
          logger.error("Ошибка синхронизации с Elastic при возврате:", error);
        }
      }

      //Написать код:
      // eventBus.emit(EVENTS.ORDER_REFUNDED, orderId);

      break;
    }
    default: {
      // Логируем на случай, если ЮKassa пришлет иное событие:
      logger.info(
        `Получено необрабатываемое событие от ЮKassa: ${notification.event}`,
      );
      break;
    }
  }

  //3.Обязательно отвечаем ЮKassa статусом 200, иначе она будет слать уведомления в течение 24 часов:
  res.status(200).send("OK");
});
