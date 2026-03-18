import { Router } from "express";
import * as AuthController from "./auth.controller.js";

const router = Router();

//-------------Роуты подмодуля аутентификации----
//Роут регистрации:
router.post("/register", AuthController.register);
//Роут активации аккаунта по ссылке:
router.get("/activate/:token", AuthController.activate);

export { router as authRouter };
