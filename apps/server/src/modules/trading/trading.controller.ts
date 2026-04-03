import { Response, NextFunction } from "express";
import { FavoritesService } from "./favorites.service.js";
import { cartService } from "./cart.service.js";
import { type ToggleFavoriteRequest } from "./trading.types.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
import { prisma } from "@repo/database";

//Контроллер добавления нового мотоцикла в избранное:
export const toggleFavorite = catchAsync(
  async (req: ToggleFavoriteRequest, res: Response, next: NextFunction) => {
    const userId = req.user.id; //Берем из middleware авторизации
    const { motorcycleId } = req.params;

    const result = await FavoritesService.toggleFavorite(userId, motorcycleId);
    res.json(result);
  },
);

//Контроллер получения id мотоциклов, находящихся в избранном:
export const getFavoriteIds = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ids = await FavoritesService.getFavoriteIds(req.user.id);
    res.json(ids);
  },
);

//Контроллер получения данных о мотоциклах по списку избранного юзера (дле реализации страницы избранного):
export const getFavoritesByIds = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    //Извлекаем данные из тела запроса
    const { ids, limit = 10, skip = 0 } = req.body;

    //Если массив пустой, сразу отдаем пустой ответ:
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ items: [], hasMore: false });
    }

    const result = await FavoritesService.getFavoritesByIds(
      ids,
      Number(limit),
      Number(skip),
    );

    return res.json(result);
  },
);

//Контроллер получения данных о товарах в корзине:
export const getCart = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cart = await cartService.getCart(req.user.id);
    res.json(cart);
  },
);

//Контроллер добавления в корзину:
export const addToCart = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      motorcycleId,
      quantity,
      model,
      price,
      image,
      brandSlug,
      slug,
      year,
    } = req.body;

    const cart = await cartService.addToCart(req.user.id, {
      id: motorcycleId,
      quantity,
      model,
      price,
      image,
      brandSlug,
      slug,
      year,
    });

    res.json(cart);
  },
);

//Изменение количества товара для конкретной позиции:
export const updateCartQuantity = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { motorcycleId, quantity } = req.body;

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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { motorcycleId } = req.params;
    const cart = await cartService.removeItem(req.user.id, motorcycleId);
    res.json(cart);
  },
);

//Удаление всех позиций в корзине:
export const removeSelectedFromCart = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { ids } = req.body; //Массив ID выбранных чекбоксами товаров
    const cart = await cartService.removeMultiple(req.user.id, ids);
    res.json(cart);
  },
);

//Получить кол-во товаров в избранном:
export const getFavoritesCount = async (req: AuthRequest, res: Response) => {
  const count = await prisma.favorite.count({
    where: { userId: req.user.id },
  });
  console.log("count:", count);
  return res.json({ count });
};
