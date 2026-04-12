import { Router } from "express";
// import { createTicket } from "./support.controller.js";
import * as supportController from "./support.controller.js";
import { supportUpload } from "../../shared/config/multerSupport.js";
import { optionalAuth } from "src/shared/middlewares/optionalAuthMiddleware.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

const router = Router();

//Роут для отправки формы в поддержку:
router.post(
  "/create",
  optionalAuth,
  supportUpload.array("files", 5),
  supportController.createTicket,
);
//Используем optionalAuth, чтобы подтянуть userId, если юзер залогинен

//Роут для получения всех тикетов пользователя:
router.get(
  "/my-tickets",
  authMiddleware,
  noCacheMiddleware,
  supportController.getUserTickets,
);

export default router;
