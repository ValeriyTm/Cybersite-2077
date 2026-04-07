import { Response, NextFunction } from "express";
import { orderService } from "./order.service.js";
import { cartService } from "../trading/cart.service.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
import { addOrderExpirationTask } from "./order.queue.js";
import { prisma } from "@repo/database";
import { addDeliveryStartTask } from "./order.queue.js";
import { searchService } from "../catalog/search.service.js";
import { PaymentService } from "../payment/payment.service.js";

//Создание заказа:
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);

    //Добавляем задачу в очередь BullMQ (таймер на 1 час):
    await addOrderExpirationTask(order.id);

    //Собираем ID только тех товаров, которые были в заказе:
    const orderedIds = req.body.items.map((item: any) => item.id);

    //После создания заказа очищаем корзину (Redis) от заказанных позиций:
    await cartService.removeMultiple(req.user.id, orderedIds);

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
};

//Получить заказы пользователя:
export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    //Забираем статус из query-параметров (например, /api/orders/my?status=PAID):
    const { status } = req.query;

    const orders = await orderService.getUserOrders(
      req.user.id,
      status as string | undefined,
    );

    res.json(orders);
  } catch (e) {
    next(e);
  }
};

//Получить список активных заказов юзера (для отображения счетчика на иконке "Мои заказы"):
export const getActiveOrdersCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const count = await prisma.order.count({
      where: {
        userId: req.user.id,
        status: { in: ["PENDING", "PAID", "DELIVERY"] }, //Статусы, при которых заказы считаются активными
      },
    });
    res.json({ count });
  } catch (e) {
    next(e);
  }
};

//!!!!!!!!!-Тестовый эндпоинт для оплаты (для проверки работы BullMQ):
//(он меняет статус заказа на PAID и удаляет резерв и физический товар из БД)
export const payOrderTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    //Достаем состав заказа, чтобы знать, что списывать:
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Заказ не найден или уже оплачен/отменен" });
    }

    //Транзакция списания:
    await prisma.$transaction(async (tx) => {
      //Обновляем статус заказа:
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      //Списываем со склада:
      for (const item of order.items) {
        await tx.stock.update({
          where: {
            motorcycleId_warehouseId: {
              motorcycleId: item.motorcycleId,
              warehouseId: order.warehouseId,
            },
          },
          data: {
            quantity: { decrement: item.quantity }, // Физическое списание со склада
            reserved: { decrement: item.quantity }, // Снятие брони
          },
        });
      }
    });

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
  } catch (e) {
    next(e);
  }
};

//Контроллер для перевода статуса заказа из DELIVERED в COMPLETED:
export const completeOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    //Ищем заказ и проверяем, принадлежит ли он текущему юзеру:
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user.id },
    });

    if (!order) return res.status(404).json({ message: "Заказ не найден" });

    //Разрешаем завершать только доставленные заказы:
    if (order.status !== "DELIVERED") {
      return res
        .status(400)
        .json({ message: "Нельзя завершить заказ, который еще не доставлен" });
    }

    //Обновляем статус:
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    res.json(updatedOrder);
  } catch (e) {
    next(e);
  }
};

//Контроллер для перевода статуса заказа в CANCELED:
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    //Ищем заказ со всеми позициями:
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ message: "Заказ не найден" });

    //Проверяем допустимость отмены (при следующих статусах уже не отменить заказ):
    const forbiddenStatuses = [
      "DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELED",
    ];
    if (forbiddenStatuses.includes(order.status)) {
      return res.status(400).json({
        message:
          "Этот заказ уже нельзя отменить (он доставлен или уже отменен)",
      });
    }

    //Логика возврата денег через ЮKassа (если заказ оплачен, инициируем возврат перед транзакцией в БД):
    if (order.paymentStatus === "succeeded" && order.paymentId) {
      try {
        const refundAmount = order.totalPrice / 1000; //Используем ту же логику /1000, что и при оплате, чтобы суммы совпали

        await PaymentService.createRefund(order.paymentId, refundAmount);
        console.log(`Возврат средств инициирован для заказа: ${order.id}`);
      } catch (refundError) {
        console.error("Ошибка при возврате в ЮKassa:", refundError);
        return res
          .status(500)
          .json({ message: "Ошибка при оформлении возврата средств" });
      }
    }

    //Транзакция (отмена + возврат резерва на склад):
    const canceledOrder = await prisma.$transaction(async (tx) => {
      // Меняем статус заказа
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELED" },
      });

      //Возвращаем товар в доступные остатки (уменьшаем резерв):
      for (const item of order.items) {
        await tx.stock.update({
          where: {
            motorcycleId_warehouseId: {
              motorcycleId: item.motorcycleId,
              warehouseId: order.warehouseId,
            },
          },
          data: {
            // Если заказ был PAID, значит quantity уже было списано (в вебхуке)
            // Если заказ был PENDING, значит списан только reserved
            ...(order.status === "PAID"
              ? { quantity: { increment: item.quantity } }
              : { reserved: { decrement: item.quantity } }),
          },
        });
      }

      return updated;
    });

    res.json(canceledOrder);
  } catch (e) {
    next(e);
  }
};
