import { Router } from "express";
//Основной контроллер модуля Trading:
import * as tradingController from "./trading.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером

const router = Router();

router.use(noCacheMiddleware);

//--------------------------Избранное:------------------------//
//Роут получения списка (массив id мотоциклов ['5gd..', 'cb55..', ...]) избранных товаров:
router.get(
  "/favorites/ids",
  // @ts-ignore:
  authMiddleware,
  tradingController.getFavoriteIds,
);
//Роут добавления товара в избранное:
router.post(
  "/favorites/toggle/:motorcycleId",
  // @ts-ignore:
  authMiddleware,
  tradingController.toggleFavorite,
);
//Роут получения данных о мотоциклах по списку избранного юзера:
router.post(
  "/favorites/details",
  // @ts-ignore:
  authMiddleware,
  tradingController.getFavoritesByIds,
);
//Роут получения кол-ва товаров в избранном:
router.get(
  "/favorites/count",
  // @ts-ignore:
  authMiddleware,
  tradingController.getFavoritesCount,
);
//--------------------------Корзина:------------------------//
//Роут получения товаров в корзине:
router.get(
  "/cart",
  // @ts-ignore:
  authMiddleware,
  tradingController.getCart,
);
//Роут добавления товара в корзину:
router.post(
  "/cart/add",
  // @ts-ignore:
  authMiddleware,
  tradingController.addToCart,
);
//Роут изменения количества позиций товара в корзине:
router.patch(
  "/cart/quantity",
  // @ts-ignore:
  authMiddleware,
  tradingController.updateCartQuantity,
);
//Роут удаления позиции товара из корзины:
router.delete(
  "/cart/item/:motorcycleId",
  // @ts-ignore:
  authMiddleware,
  tradingController.removeFromCart,
);
//Роут удаления всех позиций товара из корзины:
router.post(
  "/cart/remove-selected",
  // @ts-ignore:
  authMiddleware,
  tradingController.removeSelectedFromCart,
);
//-------Роуты чекбокса корзины:-----------//
// Переключить один чекбокс:
router.patch(
  "/cart/select",
  // @ts-ignore:
  authMiddleware,
  tradingController.toggleSelect,
);
// Массовое выделение:
router.patch(
  "/cart/select-all",
  // @ts-ignore:
  authMiddleware,
  tradingController.toggleSelectAll,
);

export default router;
