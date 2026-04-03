import { Router } from "express";
import * as orderController from "./order.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";

const router = Router();

//Роутер создания заказа:
router.post("/", authMiddleware, orderController.createOrder);
//Получение списка всех заказов юзера:
router.get("/my", authMiddleware, orderController.getMyOrders);

export default router;
