//--------------Сервис для работы с Google reCAPTCHA v3.--
//------Сервис отправляет полученный от клиента токен в Google, чтобы понять, является ли пользователь человеком или ботом.
import axios from "axios";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../utils/app-error.js";

export class RecaptchaService {
  //Метод, который принимает токен, сгенерированную браузером пользователя и проверяет токен:
  async verify(token: string) {
    const GOOGLE_URL = "https://www.google.com/recaptcha/api/siteverify"; //Эндпоинт Google API, куда нужно отправить данные для проверки

    //Если мы в режиме разработки или тестов, можно пропускать проверку, чтобы лишний раз не обращаться к Google:
    if (process.env.NODE_ENV === "test") return true;

    //Если клиент не прислал токен, выбрасываем ошибку:
    if (!token) {
      throw new AppError(400, "Токен безопасности (reCAPTCHA) отсутствует");
    }

    try {
      //Отправка запроса к Google для проверки токена:
      const response = await axios.post(
        GOOGLE_URL,
        null, // Тело пустое, шлем всё в params
        {
          params: {
            //Мой секретный ключ (на сайте Google получаю):
            secret: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            //Передаю токен, полученный от клиента:
            response: token,
          },
        },
      );
      //Вывожу в консоль оценку "ботовости" запроса с клиента от Google:
      console.log("RECAPTCHA SCORE:", response.data.score);

      //Извлекаю данные из ответа от Google:
      const { success, score } = response.data;

      //Возможные значения в ответе:
      //success: true/false (валидность токена).
      //score: от 0.0 до 1.0 (насколько запрос похож на человека).
      //Для v3 порог в 0.5 является стандартом индустрии.
      if (!success || score < 0.5) {
        //Если оценка плохая, считаем пользователя ботом и возвращаем false.
        console.error("ReCAPTCHA failed:", response.data);
        return false;
      }

      //Если всё отлично, возвращаем true.
      return true;
    } catch (error) {
      console.error("ReCAPTCHA connection error:", error);
      //Если сервис Google недоступен или произошла сетевая ошибка, мы логируем это и блокируем запрос (false). Это стратегия fail-close (безопасность важнее доступности).
      return false;
    }
  }
}

export const recaptchaService = new RecaptchaService();
