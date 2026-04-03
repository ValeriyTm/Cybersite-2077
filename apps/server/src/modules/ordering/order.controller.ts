import { Response, NextFunction } from "express";
import { orderService } from "./order.service.js";
import { cartService } from "../trading/cart.service.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
import { addOrderExpirationTask } from "./order.queue";

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
