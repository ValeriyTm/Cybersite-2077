//Тут настройка Express
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { identityRouter } from "./modules/identity/identity.routes.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";

const app = express();

//----------Подключаем middleware:--------
app.use(cors());
app.use(express.json());
app.use(cookieParser());

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
