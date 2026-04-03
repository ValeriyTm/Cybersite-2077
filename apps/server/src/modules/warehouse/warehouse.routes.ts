import { Router } from "express";
import * as warehouseController from "./warehouse.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";

// import { warehouseService } from "./warehouse.service.js";

const router = Router();

// Получить все склады для карты
router.get("/", warehouseController.getAllWarehouses);
// Рассчитать доставку:
router.post(
  "/calculate",
  authMiddleware,
  warehouseController.calculateDelivery,
);

export default router;
