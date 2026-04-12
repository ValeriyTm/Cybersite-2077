import { Router } from "express";
import * as warehouseController from "./warehouse.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

const router = Router();

router.use(noCacheMiddleware); //Запрещаем кэширование страниц браузером

// Получить все склады для карты
router.get("/", warehouseController.getAllWarehouses);
// Рассчитать доставку:
router.post(
  "/calculate",
  authMiddleware,
  warehouseController.calculateDelivery,
);

export default router;
