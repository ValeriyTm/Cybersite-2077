import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { ipFilterMiddleware } from "./payment.middleware.js";

const router = Router();

//Роут получения ответа от ЮKassa:
router.post("/webhook", ipFilterMiddleware, PaymentController.handleWebhook);

export default router;
