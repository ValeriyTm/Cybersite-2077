import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../../shared/utils/app-error.js";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL,
);

export class OAuthService {
  // Генерируем ссылку для фронтенда
  static getGoogleAuthUrl() {
    return client.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
    });
  }

  // Обмениваем код на данные пользователя
  static async getGoogleUser(code: string) {
    try {
      // 1. Обмениваем код на токены
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      const userInfo = (await client.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
      })) as any;

      return userInfo.data;
    } catch (error) {
      console.error(
        "GOOGLE_AUTH_ERROR_DETAILS:",
        error.response?.data || error.message,
      );

      throw new AppError(
        401,
        "Не удалось получить данные пользователя из Google",
      );
    }
  }
}
