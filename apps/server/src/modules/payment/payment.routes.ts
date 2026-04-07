import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { ipFilterMiddleware } from "./payment.middleware.js";

const router = Router();

router.post("/webhook", ipFilterMiddleware, PaymentController.handleWebhook);

export default router;
