import { Response, NextFunction } from "express";
import { orderService } from "./order.service.js";
import { cartService } from "../trading/cart.service.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
import { addOrderExpirationTask } from "./order.queue.js";
import { prisma } from "@repo/database";
import { addDeliveryStartTask } from "./order.queue.js";
import { searchService } from "../catalog/search.service.js";

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
//(он меняет статус заказа на PAID и удаляет резерв и физический товар из БД)
export const payOrderTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    // 1. Сначала достаем состав заказа, чтобы знать, что списывать
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Заказ не найден или уже оплачен/отменен" });
    }

    // 2. ТРАНЗАКЦИЯ СПИСАНИЯ
    await prisma.$transaction(async (tx) => {
      // Обновляем статус заказа
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      // Списываем со склада
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
        `✅ Остатки после оплаты заказа №${order.orderNumber} синхронизированы с Elastic`,
      );
    } catch (error) {
      console.error("⚠️ Ошибка синхронизации с Elastic при оплате:", error);
    }

    // 3. Запускаем BullMQ на доставку (как делали раньше)
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

//Контроллер для перевода статуса заказа в CANCELED:
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    // 1. Ищем заказ со всеми позициями
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user.id },
      include: { items: true },
    });

    if (!order) return res.status(404).json({ message: "Заказ не найден" });

    // 2. Проверяем допустимость отмены
    const forbiddenStatuses = ["DELIVERED", "COMPLETED", "CANCELED"];
    if (forbiddenStatuses.includes(order.status)) {
      return res.status(400).json({
        message:
          "Этот заказ уже нельзя отменить (он доставлен или уже отменен)",
      });
    }

    // 3. ТРАНЗАКЦИЯ: Отмена + Возврат резерва на склад ♻️
    const canceledOrder = await prisma.$transaction(async (tx) => {
      // Меняем статус заказа
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELED" },
      });

      // Возвращаем товар в доступные остатки (уменьшаем резерв)
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
