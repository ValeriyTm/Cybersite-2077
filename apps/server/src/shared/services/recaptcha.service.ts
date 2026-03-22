import axios from "axios";
import { AppError } from "../utils/app-error.js";

export class RecaptchaService {
  private static readonly GOOGLE_URL =
    "https://www.google.com/recaptcha/api/siteverify";

  static async verify(token: string) {
    // Если мы в режиме разработки или тестов, можно пропускать проверку (опционально)
    if (process.env.NODE_ENV === "test") return true;

    if (!token) {
      throw new AppError(400, "Токен безопасности (reCAPTCHA) отсутствует");
    }

    try {
      const response = await axios.post(
        this.GOOGLE_URL,
        null, // Тело пустое, шлем всё в params
        {
          params: {
            secret: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: token,
          },
        },
      );
      console.log("RECAPTCHA SCORE:", response.data.score);

      const { success, score, action } = response.data;

      // success: true/false (валидность токена)
      // score: от 0.0 до 1.0 (насколько похож на человека)
      // Для v3 порог 0.5 — стандарт индустрии
      if (!success || score < 0.5) {
        console.error("ReCAPTCHA failed:", response.data);
        return false;
      }

      return true;
    } catch (error) {
      console.error("ReCAPTCHA connection error:", error);
      // Если сервис Google недоступен, лучше залогировать и решить,
      // пускать ли юзера (fail-open) или блокировать (fail-close).
      return false;
    }
  }
}
