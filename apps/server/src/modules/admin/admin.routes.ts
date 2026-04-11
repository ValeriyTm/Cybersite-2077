import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { roleMiddleware } from "src/shared/middlewares/role.middleware.js";
import { productUpload } from "./multer.js";

const router = Router();

// Все роуты админки требуют авторизации и роли выше USER:
router.use(authMiddleware);
router.use(
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
);

//---------------------Работа с брендами:-------------
//Получение брендов:
router.get("/brands", AdminController.getBrands);
//Удаление бренда:
router.delete("/brands/:id", AdminController.deleteBrand);
//Создание бренда:
router.post("/brands", AdminController.createBrand);
//Обновление бренда:
router.patch("/brands/:id", AdminController.updateBrand);
//Поиск бренда:
router.get("/brands/search", AdminController.searchBrands);
//---------------------Работа с мотоциклами:-------------
//Получение мотоциклов конкретного бренда:
router.get("/motorcycles", AdminController.getMotorcycles);
//Создание записи о мотоцикле:
router.post(
  "/motorcycles",
  productUpload.array("images", 5),
  AdminController.createMotorcycle,
);
//Правка записи о мотоцикле:
router.patch(
  "/motorcycles/:id",
  productUpload.array("images", 5),
  AdminController.updateMotorcycle,
);
//Удаление записи о мотоцикле:
router.delete("/motorcycles/:id", AdminController.deleteMotorcycle);
//---------------------Работа с остатками:-------------
router.get("/stocks", AdminController.getStocks);
router.patch("/stocks/:id", AdminController.updateStock);
//---------------------Работа с заказами:-------------
router.get("/orders", AdminController.getOrders);
router.patch("/orders/:id/status", AdminController.updateOrderStatus);
//---------------------Управление доступом:-------------
//Получить роли юзера:
router.get("/users/", AdminController.getUsers);
//Изменить роль юзера:
router.patch("/users/:id/role", AdminController.updateUserRole);
//Удалить юзера:
router.delete("/users/:id", AdminController.deleteUser);
//---------------------Статистика:-------------
//Глобальная синхронизация Elasticsearch:
router.post("/sync-search/global", AdminController.globalSearchSync);
//---------------------Скидки и промокоды:-------------
//Получение промокодов:
router.get("/promos", AdminController.getPromoCodes);
//Получение персональных скидок:
router.get("/personal-discounts", AdminController.getPersonalDiscounts);
//---------------------Отчеты:-------------
//Скачать отчет:
router.get("/reports/download", AdminController.downloadSalesReport);
//---------------------Тикеты поддержки:-------------
//Получить все тикеты:
router.get("/tickets", AdminController.getTickets);
//Ответить на тикет:
router.patch("/tickets/:id/reply", AdminController.replyToTicket);

export default router;
