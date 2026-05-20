import { Router } from "express";
//Главный контроллер модуля Ordering:
import * as orderController from "./order.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/authMiddleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером
import { roleMiddleware } from "src/shared/middlewares/roleMiddleware.js";
import { validate } from "src/shared/middlewares/validate.js";
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

//-----------------------Тестовые эндпоинты---------------
//Тестовый эндпоинт для оплаты (если модуль Payment недоступен):
router.patch(
  "/:orderId/pay-test",
  authMiddleware,
  roleMiddleware(["SUPERADMIN"]),
  orderController.payOrderTest,
);
// PATCH http://localhost:3001/api/orders/тут-id-заказа/pay-test - после этого заказ из pending переходит в paid, а затем в delivery

export default router;
