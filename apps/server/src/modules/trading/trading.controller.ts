//Главные сервисы модуля Trading:
import { cartService } from "./cart.service.js";
import { favoritesService } from "./favorites.service.js";
//Типы:
import { Response } from "express";
import { AuthRequest } from "../../shared/middlewares/authMiddleware.js";
import {
  AddToCartArgs,
  DeleteMultipleFromCartArgs,
  DeleteSingleFromCartServiceArgs,
  GetFavsByIdsArgs,
  ToggleAllCartServiceArgs,
  ToggleFavServiceArgs,
  ToggleSingleCartServiceArgs,
  UpdateQuantityCartArgs,
} from "@repo/validation";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

//--------------------------Избранное:------------------------------//
//Контроллер добавления нового мотоцикла в избранное:
export const toggleFavorite = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id; //Берем из middleware авторизации
    const { motorcycleId } = req.params as ToggleFavServiceArgs;

    const result = await favoritesService.toggleFavorite(userId, motorcycleId);
    res.json(result);
  },
);

//Контроллер получения id мотоциклов, находящихся в избранном:
export const getFavoriteIds = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const ids = await favoritesService.getFavoriteIds(req.user.id);
    res.json(ids);
  },
);

//Контроллер получения данных о мотоциклах по списку избранного юзера (дле реализации страницы избранного):
export const getFavoritesByIds = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { ids, limit = 10, skip = 0 } = req.body as GetFavsByIdsArgs;
    const userId = req.user.id;

    //Если массив пустой, сразу отдаем пустой ответ:
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ items: [], hasMore: false });
    }

    const result = await favoritesService.getFavoritesByIds(
      ids,
      Number(limit),
      Number(skip),
      userId,
    );

    return res.json(result);
  },
);

//Получить кол-во товаров в избранном:
export const getFavoritesCount = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const count = await favoritesService.getFavoritesCount(userId);

    return res.json({ count });
  },
);

//--------------------------Корзина:------------------------------//
//Контроллер получения данных о товарах в корзине:
export const getCart = catchAsync(async (req: AuthRequest, res: Response) => {
  const cart = await cartService.getCart(req.user.id);
  res.json(cart);
});

//Контроллер добавления в корзину:
export const addToCart = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = req.body as AddToCartArgs;

  const cart = await cartService.addToCart(req.user.id, data);

  res.json(cart);
});

//Изменение количества товара для конкретной позиции:
export const updateCartQuantity = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { motorcycleId, quantity } = req.body as UpdateQuantityCartArgs;

    const cart = await cartService.updateQuantity(
      req.user.id,
      motorcycleId,
      Number(quantity),
    );
    res.json(cart);
  },
);

//Удаление позиции из корзины:
export const removeFromCart = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { motorcycleId } = req.params as DeleteSingleFromCartServiceArgs;

    const cart = await cartService.removeItem(req.user.id, motorcycleId);
    res.json(cart);
  },
);

//Удаление всех позиций в корзине:
export const removeSelectedFromCart = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { ids } = req.body as DeleteMultipleFromCartArgs; //Массив ID выбранных чекбоксами товаров
    const cart = await cartService.removeMultiple(req.user.id, ids);
    res.json(cart);
  },
);

//Переключение одного чекбокса в корзине:
export const toggleSelect = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { motorcycleId, selected } = req.body as ToggleSingleCartServiceArgs;

    const updatedCart = await cartService.toggleSelectItem(
      userId,
      motorcycleId,
      selected,
    );
    res.status(200).json(updatedCart);
  },
);

//Массовое переключение чекбоксов в корзине (Выбрать все / Снять все):
export const toggleSelectAll = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { isSelected } = req.body as ToggleAllCartServiceArgs;

    const updatedCart = await cartService.toggleSelectAll(userId, isSelected);

    res.status(200).json(updatedCart);
  },
);
