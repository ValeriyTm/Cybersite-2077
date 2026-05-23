import { Router } from "express";
//Основной контроллер подмодуля Auth:
import * as AuthController from "./auth.controller.js";
//Middleware:
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js"; //Middleware для авторизации
import { authLimiter } from "../../../shared/middlewares/rateLimiter.js"; //rate-лимитер для защиты от перебора паролей:
import { noCacheMiddleware } from "../../../shared/middlewares/noCacheMiddleware.js"; //Middleware для запрета кэширования данных на стороне клиента
import { validate } from "src/shared/middlewares/validate.js";
//Схемы валидации:
import {
  ActivationSchema,
  BackendChangePasswordSchema,
  BackendDeleteAccountSchema,
  BackendForgotPasswordSchema,
  BackendResetPasswordSchema,
  LoginSchema,
  RegisterSchema,
} from "@repo/validation";

const router = Router();

//-------------Роуты подмодуля аутентификации----
//Роут регистрации:
router.post(
  "/register",
  authLimiter,
  validate(RegisterSchema),
  AuthController.register,
);

//Роут активации аккаунта по ссылке:
router.get(
  "/activate/:token",
  validate(ActivationSchema),
  AuthController.activate,
);

//Роут входа в аккаунт:
router.post("/login", authLimiter, validate(LoginSchema), AuthController.login);

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
router.post("/refresh", AuthController.refresh);

//Роут для замены пароля (из профиля):
router.post(
  "/change-password",
  authMiddleware,
  noCacheMiddleware,
  validate(BackendChangePasswordSchema),
  AuthController.changePassword,
);

//Роут для удаления аккаунта:
router.delete(
  "/delete-account",
  authMiddleware,
  noCacheMiddleware,
  validate(BackendDeleteAccountSchema),
  AuthController.deleteAccount,
);

//Роут для ввода пароля (Forgot password):
router.post(
  "/forgot-password",
  authLimiter,
  validate(BackendForgotPasswordSchema),
  AuthController.forgotPassword,
);

//Роут для замены пароля (Reset password):
router.post(
  "/reset-password",
  authLimiter,
  validate(BackendResetPasswordSchema),
  AuthController.resetPassword,
);

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
