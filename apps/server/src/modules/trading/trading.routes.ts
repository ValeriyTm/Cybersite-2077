import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import * as tradingController from "./trading.controller.js";

const router = Router();

//Роут получения списка избранных товаров:
router.get("/favorites/ids", authMiddleware, tradingController.getFavoriteIds);
//Роут добавления товара в избранное:
router.post(
  "/favorites/toggle/:motorcycleId",
  authMiddleware,
  tradingController.toggleFavorite,
);
//Роут получения данных о мотоциклах по списку избранного юзера:
router.post(
  "/favorites/details",
  authMiddleware,
  tradingController.getFavoritesByIds,
);
//Роут получения кол-ва товаров в избранном:
router.get(
  "/favorites/count",
  authMiddleware,
  tradingController.getFavoritesCount,
);
//Роут получения товаров в корзине:
router.get("/cart", authMiddleware, tradingController.getCart);
//Роут добавления товара в корзину:
router.post("/cart/add", authMiddleware, tradingController.addToCart);
//Роут изменения количества позиций товара в корзине:
router.patch(
  "/cart/quantity",
  authMiddleware,
  tradingController.updateCartQuantity,
);
//Роут удаления позиции товара из корзины:
router.delete(
  "/cart/item/:motorcycleId",
  authMiddleware,
  tradingController.removeFromCart,
);
//Роут удаления всех позиций товара из корзины:
router.post(
  "/cart/remove-selected",
  authMiddleware,
  tradingController.removeSelectedFromCart,
);

export default router;
