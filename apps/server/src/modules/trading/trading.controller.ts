import { Response, NextFunction } from "express";
import { FavoritesService } from "./favorites.service.js";
import { type ToggleFavoriteRequest } from "./trading.types.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

export const toggleFavorite = catchAsync(
  async (req: ToggleFavoriteRequest, res: Response, next: NextFunction) => {
    const userId = req.user.id; //Берем из middleware авторизации
    const { motorcycleId } = req.params;

    const result = await FavoritesService.toggleFavorite(userId, motorcycleId);
    res.json(result);
  },
);

export const getFavoriteIds = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ids = await FavoritesService.getFavoriteIds(req.user.id);
    res.json(ids);
  },
);
