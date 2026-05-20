import { Router } from "express";
//Основной контроллер модуля Trading:
import * as tradingController from "./trading.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/authMiddleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером
import { validate } from "src/shared/middlewares/validate.js";
//Схемы валидации:
import {
  GetFavsByIdsSchema,
  ToggleFavSchema,
  AddToCartSchema,
} from "@repo/validation";

const router = Router();

router.use(noCacheMiddleware);

//--------------------------Избранное:------------------------//
//Роут получения списка (массив id мотоциклов ['5gd..', 'cb55..', ...]) избранных товаров:
router.get("/favorites/ids", authMiddleware, tradingController.getFavoriteIds);

//Роут добавления товара в избранное:
router.post(
  "/favorites/toggle/:motorcycleId",
  authMiddleware,
  validate(ToggleFavSchema),
  tradingController.toggleFavorite,
);

//Роут получения данных о мотоциклах по списку избранного юзера:
router.post(
  "/favorites/details",
  authMiddleware,
  validate(GetFavsByIdsSchema),
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
router.post(
  "/cart/add",
  authMiddleware,
  validate(AddToCartSchema),
  tradingController.addToCart,
);

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
