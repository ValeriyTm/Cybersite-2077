import { Router } from "express";
import { NewsController } from "./news.controller.js";

const router = Router();

//Получить все новости:
router.get("/news", NewsController.getAllPublished);
//Получить конкретную новость:
router.get("/news/:slug", NewsController.getBySlug);

export default router;
