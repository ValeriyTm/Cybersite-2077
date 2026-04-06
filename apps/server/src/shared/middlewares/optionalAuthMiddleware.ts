import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";
import { TokenService } from "../../modules/identity/auth/token.service.js";

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1.Извлекаем заголовок Authorization из заголовка запроса:
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      //Если токена нет, просто переходим к следующему middleware:
      return next();
    }

    // 2.Формат заголовка обычно: "Bearer <token>", поэтому извлекаем token:
    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ message: "Токен не найден" });
    }

    // 3.Проверяем валидность токена через наш TokenService (расшифровка JWT-токена, проверка подписи и срока годности):
    const userData = TokenService.validateAccessToken(accessToken) as any;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Неверный или просроченный токен" });
    }

    // 4.Записываем данные из токена в объект запроса:
    //(теперь любой следующий контроллер будет знать: req.user.id)
    req.user = userData;

    // 5.Передаем управление следующему обработчику:
    next();
  } catch (error) {
    return res.status(401).json({ message: "Ошибка авторизации" });
  }
};
