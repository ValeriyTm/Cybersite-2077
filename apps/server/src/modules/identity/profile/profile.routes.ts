import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import * as ProfileController from "./profile.controller.js";
import { uploadAvatar } from "../../../shared/middlewares/upload.middleware.js";
import { roleMiddleware } from "../../../shared/middlewares/role.middleware.js";

const router = Router();

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
); // Используем .single("avatar"), где "avatar" — имя поля в форме

//Пример middleware для определенной роли:
// router.get(
//   "/admin/all-avatars",
//   authMiddleware,
//   roleMiddleware(["ADMIN"]),
//   ProfileController.getAllAvatars,
// );

export { router as profileRoutes };
