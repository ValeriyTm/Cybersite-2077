import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { roleMiddleware } from "src/shared/middlewares/role.middleware.js";

const router = Router();

// Все роуты админки требуют авторизации и роли выше USER:
router.use(authMiddleware);
router.use(
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
);

//Работа с каталогом:
router.get("/brands", AdminController.getBrands);

//Работа с поддержкой:
router.get("/tickets", AdminController.getTickets);

//Работа с отчетами:
router.get("/reports/:type", AdminController.downloadReport);

export default router;
