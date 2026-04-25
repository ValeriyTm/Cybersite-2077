import { Router } from "express";
//Главный контроллер модуля Admin:
import * as adminController from "./admin.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js"; //Middleware для авторизации
import { roleMiddleware } from "../../shared/middlewares/role.middleware.js"; //Middleware для проверки роли пользователя
import { productUpload } from "./upload.js"; //Middleware для загрузки файлов на сервер на основе Multer
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером

const router = Router();

// Все роуты админки требуют авторизации и роли выше USER:
// @ts-ignore:
router.use(authMiddleware);
router.use(noCacheMiddleware); //Запрещаем кэширование страниц браузером

//---------------------Работа с брендами:-------------
//Получение брендов:
router.get(
  "/brands",
  //@ts-ignore:
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
  adminController.getBrands,
);
//Удаление бренда:
router.delete(
  "/brands/:id",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.deleteBrand,
);
//Создание бренда:
router.post(
  "/brands",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.createBrand,
);
//Обновление бренда:
router.patch(
  "/brands/:id",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.updateBrand,
);
//Поиск бренда:
router.get(
  "/brands/search",
  //@ts-ignore:
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
  adminController.searchBrands,
);
//---------------------Работа с мотоциклами:-------------
//Получение мотоциклов конкретного бренда:
router.get(
  "/motorcycles",
  //@ts-ignore:
  roleMiddleware(["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"]),
  adminController.getMotorcycles,
);
//Создание записи о мотоцикле:
router.post(
  "/motorcycles",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  productUpload.array("images", 5),
  adminController.createMotorcycle,
);
//Правка записи о мотоцикле:
router.patch(
  "/motorcycles/:id",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  productUpload.array("images", 5),
  adminController.updateMotorcycle,
);
//Удаление записи о мотоцикле:
router.delete(
  "/motorcycles/:id",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.deleteMotorcycle,
);
//---------------------Работа с остатками:-------------
//Получить остатки по складам:
router.get(
  "/stocks",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.getStocks,
);
//Обновить значения остатков:
router.patch(
  "/stocks/:id",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.updateStock,
);
//---------------------Работа с заказами:-------------
//Получить все заказы:
router.get(
  "/orders",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.getOrders,
);
//Изменить статус заказа:
router.patch(
  "/orders/:id/status",
  //@ts-ignore:
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  adminController.updateOrderStatus,
);
//---------------------Управление доступом:-------------
//Получить роли юзера:
router.get(
  "/users/",
  //@ts-ignore:
  roleMiddleware(["SUPERADMIN"]),
  adminController.getUsers,
);
//Изменить роль юзера:
router.patch(
  "/users/:id/role",
  //@ts-ignore:
  roleMiddleware(["SUPERADMIN"]),
  adminController.updateUserRole,
);
//Удалить юзера:
router.delete(
  "/users/:id",
  //@ts-ignore:
  roleMiddleware(["SUPERADMIN"]),
  adminController.deleteUser,
);
//---------------------Статистика:-------------
//Глобальная синхронизация Elasticsearch:
router.post(
  "/sync-search/global",
  //@ts-ignore:
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  adminController.globalSearchSync,
);
//---------------------Скидки и промокоды:-------------
//Получение промокодов:
router.get(
  "/promos",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.getPromoCodes,
);
//Получение персональных скидок:
router.get(
  "/personal-discounts",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.getPersonalDiscounts,
);
//---------------------Отчеты:-------------
//Скачать отчет:
router.get(
  "/reports/download",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.downloadSalesReport,
);
//---------------------Тикеты поддержки:-------------
//Получить все тикеты:
router.get(
  "/tickets",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.getTickets,
);
//Ответить на тикет:
router.patch(
  "/tickets/:id/reply",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.replyToTicket,
);
//Изменить статус тикета:
router.patch(
  "/tickets/:id/status",
  //@ts-ignore:
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  adminController.updateTicketStatus,
);
//---------------------Контент:-------------
//Получение всех новостей:
router.get(
  "/news",
  //@ts-ignore:
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  adminController.getNews,
);
//Создать новость:
router.post(
  "/news",
  //@ts-ignore:
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  productUpload.single("mainImage"),
  adminController.createNews,
);
//Изменить новость:
router.patch(
  "/news/:id",
  //@ts-ignore:
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  productUpload.single("mainImage"),
  adminController.updateNews,
);
//Удалить новость:
router.delete(
  "/news/:id",
  //@ts-ignore:
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  adminController.deleteNews,
);
//Обновить статус новости:
router.patch(
  "/news/:id/status",
  //@ts-ignore:
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  adminController.updateNewsStatus,
);

export default router;
