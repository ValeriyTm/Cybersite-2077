import { Router } from "express";
//Основной контроллер модуля Warehouse:
import * as warehouseController from "./warehouse.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/authMiddleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером

const router = Router();

// Получить все склады для карты:
router.get("/", warehouseController.getAllWarehouses);
// Рассчитать доставку:
router.post(
  "/calculate",
  authMiddleware,
  noCacheMiddleware,
  warehouseController.calculateDelivery,
);

export default router;
