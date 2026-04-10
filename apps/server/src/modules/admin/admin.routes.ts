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

//Работа с поддержкой:
router.get("/tickets", AdminController.getTickets);

//Работа с отчетами:
router.get("/reports/:type", AdminController.downloadReport);

//---------------------Работа с брендами:-------------
//Получение брендов:
router.get("/brands", AdminController.getBrands);
//Удаление бренда:
router.delete("/brands/:id", AdminController.deleteBrand);
//Создание бренда:
router.post("/brands", AdminController.createBrand);
//Обновление бренда:
router.patch("/brands/:id", AdminController.updateBrand);
//---------------------Работа с мотоциклами:-------------
//Получение мотоциклов конкретного бренда:
router.get("/motorcycles", AdminController.getMotorcycles);
//Создание записи о мотоцикле:
router.post("/motorcycles", AdminController.createMotorcycle);
//Правка записи о мотоцикле:
router.patch("/motorcycles/:id", AdminController.updateMotorcycle);
//Удаление записи о мотоцикле:
router.delete("/motorcycles/:id", AdminController.deleteMotorcycle);
//---------------------?:-------------
export default router;
