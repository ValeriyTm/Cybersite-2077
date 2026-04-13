import { Router } from "express";
//Основной контроллер модуля Support:
import * as supportController from "./support.controller.js";
//Загрузка файлов на сервер:
import { supportUpload } from "../../shared/config/multerSupport.js";
//Middleware:
import { optionalAuth } from "src/shared/middlewares/optionalAuthMiddleware.js"; //Проверка авторизации (опциональная)
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js"; //Проверка авторизации
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером

const router = Router();

//Роут для отправки формы в поддержку:
router.post(
  "/create",
  optionalAuth, //Чтобы подтянуть userId, если юзер залогинен
  supportUpload.array("files", 5),
  supportController.createTicket,
);

//Роут для получения всех тикетов пользователя:
router.get(
  "/my-tickets",
  authMiddleware,
  noCacheMiddleware,
  supportController.getUserTickets,
);

export default router;
