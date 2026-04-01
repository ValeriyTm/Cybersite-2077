import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import * as tradingController from "./trading.controller.js";

const router = Router();

//Получение списка избранных товаров:
router.get("/favorites/ids", authMiddleware, tradingController.getFavoriteIds);
//Добавление товара в избранное:
router.post(
  "/favorites/toggle/:motorcycleId",
  authMiddleware,
  tradingController.toggleFavorite,
);

export default router;
