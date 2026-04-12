import { Router } from "express";
import * as orderController from "./order.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

const router = Router();

router.use(noCacheMiddleware); //Запрещаем кэширование страниц браузером

//Роутер создания заказа:
router.post("/", authMiddleware, orderController.createOrder);
//Получение списка всех заказов юзера:
router.get("/my", authMiddleware, orderController.getMyOrders);
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
  orderController.completeOrder,
);
//Отмена заказа:
router.patch("/:orderId/cancel", authMiddleware, orderController.cancelOrder);

//-----------------------Тестовые эндпоинты---------------
//1) Тестовый эндпоинт для оплаты (для проверки работы BullMQ):
router.patch(
  "/:orderId/pay-test",
  authMiddleware,
  orderController.payOrderTest,
);
// PATCH http://localhost:3001/api/orders/тут-id-заказа/pay-test - после этого заказ из pending переходит в paid, а затем в delivery

export default router;
