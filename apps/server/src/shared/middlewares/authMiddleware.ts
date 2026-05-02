////-------------------------Middleware для авторизации через JWT-токены------
//(Проверяет, залогинен ли пользователь, прежде чем пустить его к защищенным данным).
//Типы:
import { Request, Response, NextFunction } from "express";
//Сервис работы с токенами:
import { tokenService } from "../../modules/identity/auth/token.service.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../utils/catch-async.js";

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authMiddleware = catchAsync(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    //1.Извлечение заголовка:
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError(401, "Пользователь не авторизован");
    }

    //2.Извлечение токена:
    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      throw new AppError(401, "Токен не найден");
    }

    //3.Проверка валидности:
    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) {
      throw new AppError(401, "Неверный или просроченный токен");
    }

    //4.Запись данных:
    req.user = userData;

    //5.Передача управления далее:
    next();
  },
);
