import { Router } from "express";
//Новостной контроллер модуля Content:
import * as newsController from "./news.controller.js";
//Middlewares:
import { validate } from "src/shared/middlewares/validate.js";
//Схемы валидации:
import { GetNewsSchema } from "@repo/validation";

const router = Router();

//Получить все новости:
router.get("/news", newsController.getAllPublished);

//Получить конкретную новость:
router.get("/news/:slug", validate(GetNewsSchema), newsController.getBySlug);

export default router;
