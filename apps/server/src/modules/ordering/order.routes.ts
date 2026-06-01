import { Router } from "express";
//Главный контроллер модуля Ordering:
import * as orderController from "./order.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/authMiddleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером
import { validate } from "../../shared/middlewares/validate.js";
//Схемы валидации:
import {
  CancelOrderSchema,
  ConfirmOrderSchema,
  CreateOrderSchema,
  GetOrdersSchema,
} from "@repo/validation";

const router = Router();

router.use(noCacheMiddleware);

//Создание заказа:
router.post(
  "/",
  authMiddleware,
  validate(CreateOrderSchema),
  orderController.createOrder,
);

//Получение списка всех заказов юзера:
router.get(
  "/my",
  authMiddleware,
  validate(GetOrdersSchema),
  orderController.getMyOrders,
);

//Получение списка активных заказов юзера:
router.get(
  "/active-count",
  authMiddleware,
  orderController.getActiveOrdersCount,
);

//Подтверждение получения заказа (перевод из статуса DELIVERED в COMPLETED):
router.patch(
  "/:orderId/complete",
  authMiddleware,
  validate(ConfirmOrderSchema),
  orderController.completeOrder,
);

//Отмена заказа (перевод в статус CANCELED):
router.patch(
  "/:orderId/cancel",
  authMiddleware,
  validate(CancelOrderSchema),
  orderController.cancelOrder,
);

export default router;
