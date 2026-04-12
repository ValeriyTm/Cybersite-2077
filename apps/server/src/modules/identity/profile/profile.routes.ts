import { Router } from "express";
import * as ProfileController from "./profile.controller.js";
//Middleware для аутентификации:
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";
//Middleware для загрузки аватара:
import { uploadAvatar } from "../../../shared/middlewares/upload.middleware.js";
//Middleware для авторизации:
import { roleMiddleware } from "../../../shared/middlewares/role.middleware.js";
//Middleware для запрета кэширования данных на стороне клиента:
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

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

//Пример middleware для определенной роли:
// router.get(
//   "/admin/all-avatars",
//   authMiddleware,
//   roleMiddleware(["ADMIN"]),
//   ProfileController.getAllAvatars,
// );

export { router as profileRoutes };
