//Типы:
import { AuthRequest } from "../../shared/middlewares/authMiddleware.js";

//Тип для запроса POST "/favorites/toggle/:motorcycleId":
export interface ToggleFavoriteRequest extends AuthRequest {
  params: {
    motorcycleId: string;
  };
}

//Тип для ответа сервера:
export interface FavoriteResponse {
  isFavorite: boolean;
}
