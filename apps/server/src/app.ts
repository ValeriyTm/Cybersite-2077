//Тут настройка Express
import express from "express";
import cors from "cors";
import { identityRouter } from "./modules/identity/identity.routes.js";

const app = express();

//----------Подключаем middleware:--------
app.use(cors());
app.use(express.json());

//----------Подключаем роуты модулей:--------
//Роуты для модуля Identity:
app.use("/api/identity", identityRouter);
//Тестовый эндпоинт для проверки работоспособности сервера (Health Check):
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

export default app;
