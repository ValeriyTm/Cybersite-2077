import { Router } from "express";
//Новостной контроллер модуля Content:
import * as newsController from "./news.controller.js";

const router = Router();

//Получить все новости:
router.get("/news", newsController.getAllPublished);
//Получить конкретную новость:
router.get("/news/:slug", newsController.getBySlug);

export default router;
