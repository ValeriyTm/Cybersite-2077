////----------------------Сервис для реализации авторизации через Google (OAuth2)-------
//Официальная библиотека Google для работы с протоколом OAuth2:
import { OAuth2Client } from "google-auth-library";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../../shared/utils/app-error.js";

//Создание экземпляра клиента:
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL,
);
//Сюда передаются данные приложения из Google Console: ID, Секрет и Callback URL (куда Google вернет юзера после входа).

export class OAuthService {
  //Генерируем ссылку на страницу входа Google:
  getGoogleAuthUrl() {
    return client.generateAuthUrl({
      //Запрашиваем разрешение на получение refresh_token (чтобы могли обновлять доступ, даже когда юзер не на сайте):
      access_type: "offline",
      //Список данных, к которым мы просим доступ (имя, аватарка и почта):
      scope: ["profile", "email"],
    });
  }

  //Обмениваем код на данные пользователя:
  async getGoogleUser(code: string) {
    try {
      // 1. Обмениваем код на токены
      const { tokens } = await client.getToken(code);
      //Когда юзер нажал «Войти», Google прислал нам временный code. Этой строкой меняем его на реальные токены доступа.

      //Сохраняем полученные токены в памяти клиента для следующих запросов:
      client.setCredentials(tokens);

      //Запрос к API Google, чтобы вытащить реальные данные профиля (имя, email, фото):
      const userInfo = (await client.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
      })) as any;

      //Возвращаем объект с данными пользователя нашему контроллеру:
      return userInfo.data;
    } catch (error) {
      //Если Google отказал, мы увидим в консоли точную причину:
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

export const oAuthService = new OAuthService();
