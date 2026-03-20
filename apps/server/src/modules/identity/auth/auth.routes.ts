import { Router } from "express";
import * as AuthController from "./auth.controller.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { authLimiter } from "../../../shared/middlewares/rate-limiter.js";

const router = Router();

//-------------Роуты подмодуля аутентификации----
//Роут регистрации:
router.post("/register", authLimiter, AuthController.register);
//Роут активации аккаунта по ссылке:
router.get("/activate/:token", AuthController.activate);
//Роут входа в аккаунт:
router.post("/login", authLimiter, AuthController.login);
//Роут выхода из аккаунта:
router.post("/logout", AuthController.logout);
//Роут выхода из всех аккаунтов:
router.post("/logout-all", authMiddleware, AuthController.logoutAll);
//Роут для обновления токенов:
router.get("/refresh", AuthController.refresh);
//Роут для замены пароля (из профиля):
router.post("/change-password", authMiddleware, AuthController.changePassword);
//Роут для удаления аккаунта:
router.delete("/delete-account", authMiddleware, AuthController.deleteAccount);
//Роут для замены пароля (Forgot password):
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
//Роут для сброса пароля (Forgot password):
router.post("/reset-password", AuthController.resetPassword);
////Роуты для OAuth:
//Роутер входа в аккаунт Google (перенаправление в Google) [OAuth]:
router.get("/google", AuthController.googleAuth);
//Обработка ответа от Google [OAuth]:
router.get("/google/callback", AuthController.googleCallback);
////Роуты для 2FA:
// Эти только для авторизованных (настройка)
router.post("/2fa/setup", authMiddleware, AuthController.setup2FA);
router.post("/2fa/enable", authMiddleware, AuthController.enable2FA);
// Этот публичный (используется на этапе логина)
router.post("/2fa/verify", AuthController.verify2FA);

export { router as authRouter };
