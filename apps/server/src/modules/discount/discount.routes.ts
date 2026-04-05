import { Router } from "express";
import * as controller from "./discount.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { roleMiddleware } from "src/shared/middlewares/role.middleware.js";

const router = Router();

//Получение информации о глобальных скидках:
router.get("/global", controller.getGlobalDiscount);

//Применение промокода:
router.post("/apply-promo", authMiddleware, controller.applyPromoCode);

//Тестовый запуск генерации скидок и промокодов (только для админа):
router.post(
  "/force-generate",
  authMiddleware,
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  controller.triggerDiscountGen,
);

export default router;
