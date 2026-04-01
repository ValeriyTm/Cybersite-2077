// apps/server/src/modules/trading/trading.types.ts
import { AuthRequest } from "../../shared/middlewares/auth.middleware.js";

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
