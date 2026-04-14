import { Router } from "express";
//Основной контроллер подмодуля Profile:
import * as ProfileController from "./profile.controller.js";
//Middleware:
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js"; //Middleware для авторизации
import { uploadAvatar } from "./upload.js"; //Middleware для загрузки файлов на сервер на основе Multer
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js"; //Middleware для запрета кэширования данных на стороне клиента

const router = Router();

router.use(noCacheMiddleware); //Запрещаем кэширование страниц браузером

//Роут для получения данных о профиле:
router.get("/me", authMiddleware, ProfileController.getMe);
//Роут для обновления данных о профиле:
router.patch("/update", authMiddleware, ProfileController.updateMe);
//Роут для обновления аватара:
router.post(
  "/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"),
  ProfileController.uploadMeAvatar,
); // Метод .single("avatar") говорит Multer, что мы ожидаем загрузку только одного файла и он будет находиться в поле с именем avatar.

export { router as profileRoutes };
