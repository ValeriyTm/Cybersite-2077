import { Router } from "express";
//Основной контроллер модуля Payment:
import * as paymentController from "./payment.controller.js";
//Middleware:
import { ipFilterMiddleware } from "./payment.middleware.js"; //Фильтрация IP-адресов, с которых может приходить запрос

const router = Router();

//Роут получения ответа от ЮKassa:
router.post("/webhook", ipFilterMiddleware, paymentController.handleWebhook);

export default router;
