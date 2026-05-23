////---------------------------Сервис для работы с JWT-токенами
//Библиотека для работы с JWT:
import jwt from "jsonwebtoken";
//Модуль для работы с криптографией:
import crypto from "node:crypto";
//Логгер Grafana Loki:
import { logger } from "../../../shared/lib/logger.js";
//Типы:
import { Role } from "@repo/database/generated/prisma";

// Определяем форму данных в токене
export interface UserPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

interface Payload {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export class TokenService {
  //Метод для генерации пары "access token - refresh token":
  generateTokens(payload: Payload) {
    //Создаем уникальный идентификатор для конкретной пары токенов (даже если два метода запустятся в одну наносекунду, строки JWT гарантированно будут разными).
    const jwtId = crypto.randomUUID(); //Соль

    const accessToken = jwt.sign(
      { ...payload, jti: jwtId },
      process.env.JWT_ACCESS_SECRET!,
      {
        expiresIn: "10m", //Срок жизни 10 минут
      },
    );

    const refreshToken = jwt.sign(
      { ...payload, jti: jwtId },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: "7d", //Срок жизни 7 дней
      },
    );

    return { accessToken, refreshToken };
  }

  //Метод для валидации (расшифровка, проверка подписи и срока жизни) access токена:
  validateAccessToken(token: string) {
    try {
      return jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET!,
      ) as unknown as UserPayload;
      //Для проверки подписи используем JWT_ACCESS_SECRET
    } catch (error) {
      if (error instanceof Error) {
        // Дифференцируем ошибки в консоли сервера для удобства отладки
        if (error.name === "TokenExpiredError") {
          console.log(
            "ℹ️ [JWT Access]: Срок действия токена истек (обычное явление)",
          );
        } else if (error.name === "JsonWebTokenError") {
          console.error(
            "🚨 [JWT Access]: Критическая ошибка! Подпись токена невалидна или токен изменен:",
            error.message,
          );
        } else {
          console.error(
            "❓ [JWT Access]: Непредвиденная ошибка валидации токена:",
            error,
          );
        }
      }
      return null;
    }
  }

  //Метод для валидации (расшифровка, проверка подписи и срока жизни) refresh токена:
  validateRefreshToken(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);

      return payload;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TokenExpiredError") {
          console.log(
            "ℹ️ [JWT Refresh]: Refresh-токен протух. Сессия окончательно завершена.",
          );
        } else {
          console.error(
            "🚨 [JWT Refresh]: Попытка подделки Refresh-токена или ротация секретных ключей:",
            error.message,
          );
        }
      }
      return null;
    }
  }
}

export const tokenService = new TokenService();
