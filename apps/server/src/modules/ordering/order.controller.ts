//Типы:
import { Response } from "express";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
//Главный сервис модуля Ordering:
import { orderService } from "./order.service.js";
//Поисковый сервис модуля Catalog:
import { searchService } from "../catalog/search.service.js";
//Сервис оплаты модуля Payment:
import { paymentService } from "../payment/index.js";
//Сервис корзины модуля Trading:
import { cartService } from "../trading/index.js";
//Очереди для отмены заказа / изменения статуса заказа:
import { addOrderExpirationTask, addDeliveryStartTask } from "./order.queue.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

//Создание заказа:
export const createOrder = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const order = await orderService.createOrder(req.user.id, req.body);

    //Добавляем задачу в очередь BullMQ (таймер на 1 час):
    await addOrderExpirationTask(order.id);

    //Собираем ID только тех товаров, которые были в заказе:
    const orderedIds = req.body.items.map((item: any) => item.id);

    //После создания заказа очищаем корзину (Redis) от заказанных позиций:
    await cartService.removeMultiple(req.user.id, orderedIds);

    res.status(201).json(order);
  },
);

//Получить заказы пользователя:
export const getMyOrders = catchAsync(
  async (req: AuthRequest, res: Response) => {
    //Забираем статус из query-параметров (например, /api/orders/my?status=PAID):
    const { status } = req.query;

    const orders = await orderService.getUserOrders(
      req.user.id,
      status as string | undefined,
    );

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

//!Тестовый эндпоинт для оплаты (для проверки работы BullMQ)!:
//(он меняет статус заказа на PAID и удаляет резерв и физический товар из БД)
export const payOrderTest = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    //Достаем состав заказа, чтобы знать, что списывать:
    const order = await orderService.getUserOrderWithItems(orderId, userId);

    if (!order || order.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Заказ не найден или уже оплачен/отменен" });
    }

    //Транзакция списания остатков (+ удаления зарезервироанного кол-ва) и изменения статуса:
    await orderService.confirmUserOrder(orderId, order);

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

    res.json({
      message: "Оплата прошла, остатки списаны, доставка запланирована!",
    });
  },
);

//Контроллер для перевода статуса заказа из DELIVERED в COMPLETED:
export const completeOrder = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
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
    const { orderId } = req.params;
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

    //Логика возврата денег через ЮKassа (если заказ оплачен, инициируем возврат перед транзакцией в БД):
    if (order.paymentStatus === "succeeded" && order.paymentId) {
      try {
        const refundAmount = order.totalPrice / 1000; //Используем ту же логику /1000, что и при оплате, чтобы суммы совпали

        await paymentService.createRefund(order.paymentId, refundAmount);
        console.log(`Возврат средств инициирован для заказа: ${order.id}`);
      } catch (refundError) {
        console.error("Ошибка при возврате в ЮKassa:", refundError);
        throw new AppError(500, "Ошибка при оформлении возврата средств");
      }
    }

    //Транзакция (отмена + возврат резерва на склад):
    const canceledOrder = await orderService.cancelUserOrder(orderId, order);

    res.json(canceledOrder);
  },
);
