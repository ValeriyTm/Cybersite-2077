import { Router } from "express";
import * as AuthController from "./auth.controller.js";
//Middleware для проверки аутентифицирован ли пользователь:
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";
//Middleware жесткий rate-лимитер для защиты от перебора паролей:
import { authLimiter } from "../../../shared/middlewares/rate-limiter.js";
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

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
router.post(
  "/logout-all",
  authMiddleware,
  noCacheMiddleware,
  AuthController.logoutAll,
);
//Роут для обновления токенов:
router.get("/refresh", AuthController.refresh);
//Роут для замены пароля (из профиля):
router.post(
  "/change-password",
  authMiddleware,
  noCacheMiddleware,
  AuthController.changePassword,
);
//Роут для удаления аккаунта:
router.delete(
  "/delete-account",
  authMiddleware,
  noCacheMiddleware,
  AuthController.deleteAccount,
);
//Роут для замены пароля (Forgot password):
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
//Роут для сброса пароля (Forgot password):
router.post("/reset-password", authLimiter, AuthController.resetPassword);
//-------Роуты для OAuth:
//Роут входа в аккаунт Google (перенаправление в Google) [OAuth]:
router.get("/google", AuthController.googleAuth);
//Роут получения и обработки ответа от Google [OAuth]:
router.get("/google/callback", AuthController.googleCallback);
//-------Роуты для 2FA:
//Роут для генерации данных для включения 2FA:
router.post(
  "/2fa/setup",
  authMiddleware,
  noCacheMiddleware,
  AuthController.setup2FA,
);
//Роут для включения 2FA:
router.post(
  "/2fa/enable",
  authMiddleware,
  noCacheMiddleware,
  AuthController.enable2FA,
);
//Роут для входа в аккаунт для тех, у кого включена 2FA:
router.post("/2fa/verify", authLimiter, AuthController.verify2FA); // Этот роут публичный (используется на этапе логина)

export { router as authRouter };
