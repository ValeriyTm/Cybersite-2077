import { Router } from "express";
import * as discountController from "./discount.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { roleMiddleware } from "src/shared/middlewares/role.middleware.js";
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

const router = Router();

//Получение информации о глобальных скидках:
router.get("/global", discountController.getGlobalDiscount);

//Применение промокода:
router.post(
  "/apply-promo",
  authMiddleware,
  noCacheMiddleware,
  discountController.applyPromoCode,
);

//Тестовый запуск генерации скидок и промокодов (только для админа):
router.post(
  "/force-generate",
  authMiddleware,
  noCacheMiddleware,
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  discountController.triggerDiscountGen,
);

//Получение списка активных промокодов:
router.get("/all-promos", discountController.getAllActivePromos);

export default router;
