import { Router } from "express";
//Основной контроллер модуля Warehouse:
import * as warehouseController from "./warehouse.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/authMiddleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером
import { validate } from "../../shared/middlewares/validate.js";
//Схемы валидации:
import { DeliveryCalculateSchema } from "@repo/validation";

const router = Router();

// Получить все склады для карты:
router.get("/", warehouseController.getAllWarehouses);

// Рассчитать доставку:
router.post(
  "/calculate",
  authMiddleware,
  noCacheMiddleware,
  validate(DeliveryCalculateSchema),
  warehouseController.calculateDelivery,
);

export default router;
