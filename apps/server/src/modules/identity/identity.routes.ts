import { Router } from "express";
//Роуты подмодулей:
import { authRouter } from "./auth/auth.routes.js";
import { profileRoutes } from "./profile/profile.routes.js"; // добавим позже

const router = Router();

//---------Роуты внутри модуля Identity-------
//Роуты для подмодуля аутентификации:
router.use("/auth", authRouter);
//Роуты для подмодуля профиля пользователя:
router.use("/profile", profileRoutes);

export { router as identityRouter };
