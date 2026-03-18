//Тут настройка Express
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { identityRouter } from "./modules/identity/identity.routes.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";

const app = express();

//----------Подключаем middleware:--------
//Тут будет Morgan

//Настройка политики CORS:
app.use(cors());
//Парсим тело запроса:
app.use(express.json());
//Извлекаем данные из кук:
app.use(cookieParser());
//Открываем папку apps/server/uploads для раздачи:
app.use("/uploads", express.static("uploads"));

//----------Подключаем роуты модулей:--------
//Роуты для модуля Identity:
app.use("/api/identity", identityRouter);
//Тестовый эндпоинт для проверки работоспособности сервера (Health Check):
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

//Обработка ошибок (всегда ставлю в конце):
app.use(errorMiddleware);

export default app;
