import { Router } from "express";
//Основной контроллер модуля Support:
import * as supportController from "./support.controller.js";
//Middleware:
import { optionalAuth } from "../../shared/middlewares/optionalAuthMiddleware.js"; //Проверка авторизации (опциональная)
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером
import { supportUpload } from "./upload.js"; //Middleware для загрузки файлов на сервер на основе Multer

const router = Router();

//Роут для отправки формы в поддержку:
router.post(
  "/create",
  // @ts-ignore:
  optionalAuth, //Чтобы подтянуть userId, если юзер залогинен
  supportUpload.array("files", 5), //Загружаем файлы при помощи Multer (files - это имя ключа (поля), которое  фронтенд в FormData использует для отправки файлов; 5 - это лимит на количество файлов)
  supportController.createTicket,
);

//Роут для получения всех тикетов пользователя:
router.get(
  "/my-tickets",
  // @ts-ignore:
  authMiddleware,
  noCacheMiddleware,
  supportController.getUserTickets,
);

export default router;
