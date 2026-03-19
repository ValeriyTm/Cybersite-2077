import { Router } from "express";
import * as AuthController from "./auth.controller.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const router = Router();

//-------------Роуты подмодуля аутентификации----
//Роут регистрации:
router.post("/register", AuthController.register);
//Роут активации аккаунта по ссылке:
router.get("/activate/:token", AuthController.activate);
//Роут входа в аккаунт:
router.post("/login", AuthController.login);
//Роут выхода из аккаунта:
router.post("/logout", AuthController.logout);
//Роут выхода из всех аккаунтов:
router.post("/logout-all", authMiddleware, AuthController.logoutAll);
//Роут для обновления токенов:
router.get("/refresh", AuthController.refresh);

export { router as authRouter };
