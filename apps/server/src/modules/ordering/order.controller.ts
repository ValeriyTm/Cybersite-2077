//Типы:
import { Response } from "express";
import { AuthRequest } from "../../shared/middlewares/authMiddleware.js";
//Главный сервис модуля Ordering:
import { orderService } from "./order.service.js";
//Поисковый сервис модуля Catalog:
import { searchService } from "../catalog/search.service.js";
//Сервис оплаты модуля Payment:
import { paymentService } from "../payment/index.js";
//Сервис корзины модуля Trading:
import { cartService } from "../trading/index.js";
//Очереди для отмены заказа / изменения статуса заказа:
import { addOrderExpirationTask } from "./order.queue.js";
//Логирование:
import { logger } from "../../shared/lib/logger.js";
//Генерация событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
//Типы:
import {
  CancelOrderParamArgs,
  ConfirmOrderParamArgs,
  CreateOrderServiceArgs,
  GetOrdersArgs,
} from "@repo/validation";

//Создание заказа:
export const createOrder = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const data = req.body as CreateOrderServiceArgs;

    const order = await orderService.createOrder(req.user.id, data);

    //Добавляем задачу в очередь BullMQ (таймер на 1 час):
    await addOrderExpirationTask(order.id);

    //Собираем ID только тех товаров, которые были в заказе:
    const orderedIds = data.items.map((item) => item.id);

    //После создания заказа очищаем корзину (Redis) от заказанных позиций:
    await cartService.removeMultiple(req.user.id, orderedIds);

    res.status(201).json(order);
  },
);

//Получить заказы пользователя:
export const getMyOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { status } = req.query as GetOrdersArgs;

    const orders = await orderService.getUserOrders(req.user.id, status);

    res.json(orders);
  },
);

//Получить список активных заказов юзера (для отображения счетчика на иконке "Мои заказы"):
export const getActiveOrdersCount = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    const count = await orderService.getActiveOrdersCount(userId);
    res.json({ count });
  },
);

//Контроллер для перевода статуса заказа из DELIVERED в COMPLETED:
export const completeOrder = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params as ConfirmOrderParamArgs;
    const userId = req.user.id;

    //Ищем заказ и проверяем, принадлежит ли он текущему юзеру:
    const order = await orderService.getUserOrder(orderId, userId);
    if (!order) return res.status(404).json({ message: "Заказ не найден" });

    //Разрешаем завершать только доставленные заказы:
    if (order.status !== "DELIVERED") {
      return res
        .status(400)
        .json({ message: "Нельзя завершить заказ, который еще не доставлен" });
    }

    //Обновляем статус заказа в PostgreSQL:
    const updatedOrder = await orderService.changeStatusOrder(
      orderId,
      "COMPLETED",
    );

    res.json(updatedOrder);
  },
);

//Контроллер для перевода статуса заказа в CANCELED:
export const cancelOrder = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params as CancelOrderParamArgs;
    const userId = req.user.id;

    //Ищем заказ со всеми позициями:
    const order = await orderService.getUserOrderWithItems(orderId, userId);
    if (!order) return res.status(404).json({ message: "Заказ не найден" });

    //Проверяем допустимость отмены (при следующих статусах уже не отменить заказ):
    const forbiddenStatuses = [
      "DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELED",
    ];
    if (forbiddenStatuses.includes(order.status)) {
      throw new AppError(
        400,
        "Этот заказ уже нельзя отменить (он доставлен или уже отменен)",
      );
    }

    //А) Логика для оплаченного заказа (возврат денег через ЮKassа):
    if (order.paymentStatus === "succeeded" && order.paymentId) {
      try {
        const refundAmount = order.totalPrice / 1000; //Используем ту же логику /1000, что и при оплате, чтобы суммы совпали

        await paymentService.initiateRefund(
          order.paymentId,
          refundAmount,
          orderId,
        );
        logger.info(`Возврат средств инициирован для заказа: ${order.id}`);
        return res.json({
          message: "Запрос на отмену и возврат средств отправлен в банк",
        });
      } catch (refundError) {
        logger.error("Ошибка при возврате в ЮKassa:", refundError);
        throw new AppError(500, "Ошибка при оформлении возврата средств");
      }
    }

    //Б) Логика для неоплаченного заказа:
    if (!order.paymentId) {
      throw new AppError(
        400,
        "У данного заказа отсутствует идентификатор платежа",
      );
    }
    const canceledOrder = await orderService.cancelUserOrder(order.id);

    //Создаём событие для отправки оповещения в ТГ:
    eventBus.emit(EVENTS.ORDER_CANCELED, canceledOrder);

    //Обновляем Elastic, так как снялась бронь (reserved):
    try {
      for (const item of canceledOrder.items) {
        await searchService.updateStockInElastic(item.motorcycleId);
      }
    } catch (error) {
      logger.error("Ошибка Elastic при отмене:", error);
    }

    res.json(canceledOrder);
  },
);
