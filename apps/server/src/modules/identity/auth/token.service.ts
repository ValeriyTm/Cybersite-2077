////---------------------------Сервис для работы с JWT-токенами
//Библиотека для работы с JWT:
import jwt from "jsonwebtoken";

export class TokenService {
  //Метод для генерации пары "access token - refresh token":
  generateTokens(payload: any) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "10m", //Срок жизни 5 минут
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "7d", //Срок жизни 7 дней
    });

    return { accessToken, refreshToken };
  }

  //Метод для валидации (расшифровка, проверка подписи и срока жизни) access токена:
  validateAccessToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
      //Для проверки подписи используем JWT_ACCESS_SECRET
    } catch (e) {
      return null;
    }
  }

  //Метод для валидации (расшифровка, проверка подписи и срока жизни) refresh токена:
  validateRefreshToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
      //Для проверки подписи используем JWT_REFRESH_SECRET
    } catch (e) {
      return null;
    }
  }
}

export const tokenService = new TokenService();
