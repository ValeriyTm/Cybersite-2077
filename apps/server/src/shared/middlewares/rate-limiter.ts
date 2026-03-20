import { rateLimit } from "express-rate-limit";
import { AppError } from "../utils/app-error.js";

// Общий лимит для всех запросов (защита от DDOS):
export const commonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  limit: 100, // максимум 100 запросов с одного IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: () => {
    throw new AppError(429, "Слишком много запросов, попробуйте позже");
  },
});

// Жесткий лимит для логина и регистрации (защита от перебора паролей):
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  limit: 15, // всего 15 попыток в час на создание аккаунта или вход
  skipSuccessfulRequests: true, // если вход успешен — не считаем попытку
  handler: () => {
    throw new AppError(
      429,
      "Слишком много неудачных попыток входа. Попробуйте через час",
    );
  },
});
