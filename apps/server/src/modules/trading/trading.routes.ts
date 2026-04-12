import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import * as tradingController from "./trading.controller.js";
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

const router = Router();

router.use(noCacheMiddleware); //Запрещаем кэширование страниц браузером
//--------------------------Избранное:------------------------//
//Роут получения списка (массив id мотоциклов ['5gd..', 'cb55..', ...]) избранных товаров:
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
//--------------------------Корзина:------------------------//
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
//-------Роуты чекбокса корзины:-----------//
// Переключить один чекбокс:
router.patch("/cart/select", authMiddleware, tradingController.toggleSelect);
// Массовое выделение:
router.patch(
  "/cart/select-all",
  authMiddleware,
  tradingController.toggleSelectAll,
);

export default router;
