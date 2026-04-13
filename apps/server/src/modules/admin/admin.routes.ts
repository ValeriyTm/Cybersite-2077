import { Router } from "express";
import { AdminController } from "./admin.controller.js";
//Middleware:
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { roleMiddleware } from "src/shared/middlewares/role.middleware.js";
import { productUpload } from "./upload.js"; //Middleware для загрузки файлов на сервер на основе Multer
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js";

const router = Router();

// Все роуты админки требуют авторизации и роли выше USER:
router.use(authMiddleware);
router.use(noCacheMiddleware); //Запрещаем кэширование страниц браузером

//---------------------Работа с брендами:-------------
//Получение брендов:
router.get(
  "/brands",
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
  AdminController.getBrands,
);
//Удаление бренда:
router.delete(
  "/brands/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.deleteBrand,
);
//Создание бренда:
router.post(
  "/brands",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.createBrand,
);
//Обновление бренда:
router.patch(
  "/brands/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.updateBrand,
);
//Поиск бренда:
router.get(
  "/brands/search",
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
  AdminController.searchBrands,
);
//---------------------Работа с мотоциклами:-------------
//Получение мотоциклов конкретного бренда:
router.get(
  "/motorcycles",
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
  AdminController.getMotorcycles,
);
//Создание записи о мотоцикле:
router.post(
  "/motorcycles",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  productUpload.array("images", 5),
  AdminController.createMotorcycle,
);
//Правка записи о мотоцикле:
router.patch(
  "/motorcycles/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  productUpload.array("images", 5),
  AdminController.updateMotorcycle,
);
//Удаление записи о мотоцикле:
router.delete(
  "/motorcycles/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.deleteMotorcycle,
);
//---------------------Работа с остатками:-------------
//Получить остатки по складам:
router.get(
  "/stocks",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.getStocks,
);
//Обновить значения остатков:
router.patch(
  "/stocks/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.updateStock,
);
//---------------------Работа с заказами:-------------
//Получить все заказы:
router.get(
  "/orders",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.getOrders,
);
//Изменить статус заказа:
router.patch(
  "/orders/:id/status",
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  AdminController.updateOrderStatus,
);
//---------------------Управление доступом:-------------
//Получить роли юзера:
router.get("/users/", roleMiddleware(["SUPERADMIN"]), AdminController.getUsers);
//Изменить роль юзера:
router.patch(
  "/users/:id/role",
  roleMiddleware(["SUPERADMIN"]),
  AdminController.updateUserRole,
);
//Удалить юзера:
router.delete(
  "/users/:id",
  roleMiddleware(["SUPERADMIN"]),
  AdminController.deleteUser,
);
//---------------------Статистика:-------------
//Глобальная синхронизация Elasticsearch:
router.post(
  "/sync-search/global",
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  AdminController.globalSearchSync,
);
//---------------------Скидки и промокоды:-------------
//Получение промокодов:
router.get(
  "/promos",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.getPromoCodes,
);
//Получение персональных скидок:
router.get(
  "/personal-discounts",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.getPersonalDiscounts,
);
//---------------------Отчеты:-------------
//Скачать отчет:
router.get(
  "/reports/download",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.downloadSalesReport,
);
//---------------------Тикеты поддержки:-------------
//Получить все тикеты:
router.get(
  "/tickets",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.getTickets,
);
//Ответить на тикет:
router.patch(
  "/tickets/:id/reply",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.replyToTicket,
);
//Изменить статус тикета:
router.patch(
  "/tickets/:id/status",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  AdminController.updateTicketStatus,
);
//---------------------Контент:-------------
//Получение всех новостей:
router.get(
  "/news",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  AdminController.getNews,
);
//Создать новость:
router.post(
  "/news",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  productUpload.single("mainImage"),
  AdminController.createNews,
);
//Изменить новость:
router.patch(
  "/news/:id",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  productUpload.single("mainImage"),
  AdminController.updateNews,
);
//Удалить новость:
router.delete(
  "/news/:id",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  AdminController.deleteNews,
);
//Обновить статус новости:
router.patch(
  "/news/:id/status",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  AdminController.updateNewsStatus,
);

export default router;
