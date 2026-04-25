import { Router } from "express";
//Главный контроллер модуля Discount:
import * as discountController from "./discount.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js"; //Проверка авторизации
import { roleMiddleware } from "../../shared/middlewares/role.middleware.js"; //Проверка роли пользователя
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером

const router = Router();

//Получение информации о глобальных скидках:
router.get("/global", discountController.getGlobalDiscount);

//Применение промокода:
router.post(
  "/apply-promo",
  //@ts-ignore:
  authMiddleware,
  noCacheMiddleware,
  discountController.applyPromoCode,
);

//Тестовый запуск генерации скидок и промокодов (только для админа):
router.post(
  "/force-generate",
  //@ts-ignore:
  authMiddleware,
  noCacheMiddleware,
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  discountController.triggerDiscountGen,
);

//Получение списка активных промокодов:
router.get("/all-promos", discountController.getAllActivePromos);

export default router;
