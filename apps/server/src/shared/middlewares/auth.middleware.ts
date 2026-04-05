////-------------------------Middleware для авторизации через JWT-токены------
//(Проверяет, залогинен ли пользователь, прежде чем пустить его к защищенным данным).
import { Request, Response, NextFunction } from "express";
import { TokenService } from "../../modules/identity/auth/token.service.js";

// Расширяем стандартный тип Request в Express, чтобы TS не ругался на req.user:
export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1.Извлекаем заголовок Authorization из заголовка запроса:
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Пользователь не авторизован" });
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
