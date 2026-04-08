import { Router } from "express";
import { createTicket } from "./support.controller.js";
import { supportUpload } from "../../shared/config/multerSupport.js";
import { optionalAuth } from "src/shared/middlewares/optionalAuthMiddleware.js";

const router = Router();

//Роут для отправки формы в поддержку:
router.post(
  "/create",
  optionalAuth,
  supportUpload.array("files", 5),
  createTicket,
);
//Используем optionalAuth, чтобы подтянуть userId, если юзер залогинен

export default router;
