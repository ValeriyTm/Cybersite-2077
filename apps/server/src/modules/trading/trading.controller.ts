import { Response, NextFunction } from "express";
import { FavoritesService } from "./favorites.service.js";
import { type ToggleFavoriteRequest } from "./trading.types.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

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

//Контроллер получения данных о мотоциклах по списку избранного юзера:
export const getFavoritesByIds = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Извлекаем данные из тела запроса
    const { ids, limit = 10, skip = 0 } = req.body;

    // Если массив пустой, сразу отдаем пустой ответ, не мучая базу
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ items: [], hasMore: false });
    }

    // Вызываем сервис (который мы набросали в прошлом шаге)
    const result = await FavoritesService.getFavoritesByIds(
      ids,
      Number(limit),
      Number(skip),
    );

    return res.json(result);
  },
);
