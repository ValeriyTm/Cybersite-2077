import { Response, NextFunction } from "express";
import { orderService } from "./order.service.js";
import { cartService } from "../trading/cart.service.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
import { addOrderExpirationTask } from "./order.queue";
import { prisma } from "@repo/database";
import { addDeliveryStartTask } from "./order.queue.js";

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);

    //Добавляем задачу в очередь BullMQ (таймер на 1 час):
    await addOrderExpirationTask(order.id);

    // Собираем ID только тех товаров, которые были в заказе:
    const orderedIds = req.body.items.map((item: any) => item.id);

    //После создания заказа очищаем корзину (Redis) от заказанных позиций:
    await cartService.removeMultiple(req.user.id, orderedIds);

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
};

export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id);
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
        status: { in: ["PENDING", "PAID", "DELIVERY"] },
      },
    });
    res.json({ count });
  } catch (e) {
    next(e);
  }
};

//!!!!!!!!!-Тестовый эндпоинт для оплаты (для проверки работы BullMQ):
export const payOrderTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    // 1. Обновляем статус в БД
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    // 2.ПИШЕМ ЗАДАЧУ В ОЧЕРЕДЬ (на смену статуса через 1-2 часа)
    await addDeliveryStartTask(order.id);

    res.json({
      message: `Заказ №${order.orderNumber} оплачен. Доставка запланирована!`,
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

    // 1. Ищем заказ и проверяем, принадлежит ли он текущему юзеру 🛡️
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user.id },
    });

    if (!order) return res.status(404).json({ message: "Заказ не найден" });

    // 2. Разрешаем завершать только доставленные заказы
    if (order.status !== "DELIVERED") {
      return res
        .status(400)
        .json({ message: "Нельзя завершить заказ, который еще не доставлен" });
    }

    // 3. Обновляем статус 🏁
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    res.json(updatedOrder);
  } catch (e) {
    next(e);
  }
};
