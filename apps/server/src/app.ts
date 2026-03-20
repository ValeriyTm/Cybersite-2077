//Тут настройка Express
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import { identityRouter } from "./modules/identity/identity.routes.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import { xssClean } from "./shared/middlewares/xss-clean.js";

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  //Разрешаем передавать учетные данные с клиента:
  credentials: true,
  optionsSuccessStatus: 200,
};
//----------Подключаем middleware:--------
//Тут будет Morgan

//Безопасность:
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "data:",
          //Разрешаем загрузку аватарок с Google и своего сервера:
          "https://*.googleusercontent.com", // Используем маску для надежности
          "http://localhost:3001",
        ],
        // Запрещает использование опасных функций (DOM sinks) без специальных политик:
        "require-trusted-types-for": ["'script'"],
        // Разрешаем политику DOMPurify
        // или политики популярных библиотек:
        "trusted-types": ["default", "dompurify"],
      },
    },
  }),
);
//Настройка политики CORS:
app.use(cors(corsOptions));
//Парсим тело запроса:
app.use(express.json());
//Санитайзинг входящих данных:
app.use(xssClean);
//Защита от атак типа «загрязнение параметров HTTP»:
app.use(hpp()); // Защищает и req.query, и req.body (т.к. стоит после express.json)
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
