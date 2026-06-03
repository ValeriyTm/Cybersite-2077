import { Router } from "express";
//Главный контроллер модуля Admin:
import * as adminController from "./admin.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/authMiddleware.js"; //Middleware для авторизации
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware.js"; //Middleware для проверки роли пользователя
import { productUpload, newsUpload } from "./upload.js"; //Middleware для загрузки файлов на сервер на основе Multer
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером
import { validate } from "../../shared/middlewares/validate.js";
//Схемы валидации:
import {
  ChangeOrderStatusAdminSchema,
  ChangeStatusOfTicketAdminSchema,
  CreateBrandAdminSchema,
  createMotorcycleAdminSchema,
  CreateNewsSchema,
  DeleteBrandAdminSchema,
  DeleteMotoAdminSchema,
  DeleteNewsSchema,
  DeleteUserAdminSchema,
  GetBrandsAdminSchema,
  GetMotosAdminSchema,
  GetOrdersAdminSchema,
  GetPersonalDiscountsSchema,
  GetReportsAdminSchema,
  GetStocksAdminSchema,
  GetTicketsAdminSchema,
  GetUsersAdminSchema,
  ReplyOnTicketAdminSchema,
  SearchBrandsAdminSchema,
  UpdateBrandAdminSchema,
  updateMotorcycleAdminSchema,
  UpdateNewsSchema,
  UpdateStatusNewsSchema,
  UpdateStocksAdminSchema,
  UpdateUserStatusAdminSchema,
} from "@repo/validation";

const router = Router();

// Все роуты админки требуют авторизации и роли выше USER:
router.use(authMiddleware);
router.use(noCacheMiddleware); //Запрещаем кэширование страниц браузером

//---------------------Работа с брендами:-------------
//Получение брендов:
router.get(
  "/brands",
  roleMiddleware([
    "ADMIN",
    "SUPERADMIN",
    "MANAGER",
    "CONTENT_EDITOR",
    "WATCHER",
  ]),
  validate(GetBrandsAdminSchema),
  adminController.getBrands,
);
//Удаление бренда:
router.delete(
  "/brands/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  validate(DeleteBrandAdminSchema),
  adminController.deleteBrand,
);

//Создание бренда:
router.post(
  "/brands",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  validate(CreateBrandAdminSchema),
  adminController.createBrand,
);

//Обновление бренда:
router.patch(
  "/brands/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  validate(UpdateBrandAdminSchema),
  adminController.updateBrand,
);

//Поиск бренда:
router.get(
  "/brands/search",
  roleMiddleware([
    "ADMIN",
    "SUPERADMIN",
    "MANAGER",
    "CONTENT_EDITOR",
    "WATCHER",
  ]),
  validate(SearchBrandsAdminSchema),
  adminController.searchBrands,
);

//---------------------Работа с мотоциклами:-------------
//Получение мотоциклов конкретного бренда:
router.get(
  "/motorcycles",
  roleMiddleware([
    "ADMIN",
    "SUPERADMIN",
    "MANAGER",
    "CONTENT_EDITOR",
    "WATCHER",
  ]),
  validate(GetMotosAdminSchema),
  adminController.getMotorcycles,
);

//Создание записи о мотоцикле:
router.post(
  "/motorcycles",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  productUpload.array("images", 5),
  validate(createMotorcycleAdminSchema),
  adminController.createMotorcycle,
);

//Правка записи о мотоцикле:
router.patch(
  "/motorcycles/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  productUpload.array("images", 5),
  validate(updateMotorcycleAdminSchema),
  adminController.updateMotorcycle,
);

//Удаление записи о мотоцикле:
router.delete(
  "/motorcycles/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  validate(DeleteMotoAdminSchema),
  adminController.deleteMotorcycle,
);

//---------------------Работа с остатками:-------------
//Получить остатки по складам:
router.get(
  "/stocks",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"]),
  validate(GetStocksAdminSchema),
  adminController.getStocks,
);

//Обновить значения остатков:
router.patch(
  "/stocks/:id",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  validate(UpdateStocksAdminSchema),
  adminController.updateStock,
);

//---------------------Работа с заказами:-------------
//Получить все заказы:
router.get(
  "/orders",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"]),
  validate(GetOrdersAdminSchema),
  adminController.getOrders,
);

//Изменить статус заказа:
router.patch(
  "/orders/:id/status",
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  validate(ChangeOrderStatusAdminSchema),
  adminController.updateOrderStatus,
);
//---------------------Управление доступом:-------------
//Получить роли юзера:
router.get(
  "/users/",
  roleMiddleware(["SUPERADMIN"]),
  validate(GetUsersAdminSchema),
  adminController.getUsers,
);

//Изменить роль юзера:
router.patch(
  "/users/:id/role",
  roleMiddleware(["SUPERADMIN"]),
  validate(UpdateUserStatusAdminSchema),
  adminController.updateUserRole,
);

//Удалить юзера:
router.delete(
  "/users/:id",
  roleMiddleware(["SUPERADMIN"]),
  validate(DeleteUserAdminSchema),
  adminController.deleteUser,
);
//---------------------Статистика:-------------
//Глобальная синхронизация Elasticsearch:
router.post(
  "/sync-search/global",
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  adminController.globalSearchSync,
);

//---------------------Скидки и промокоды:-------------
//Получение промокодов:
router.get(
  "/promos",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"]),
  adminController.getPromoCodes,
);

//Получение персональных скидок:
router.get(
  "/personal-discounts",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"]),
  validate(GetPersonalDiscountsSchema),
  adminController.getPersonalDiscounts,
);

//---------------------Отчеты:-------------
//Скачать отчет:
router.get(
  "/reports/download",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"]),
  validate(GetReportsAdminSchema),
  adminController.downloadSalesReport,
);

//---------------------Тикеты поддержки:-------------
//Получить все тикеты:
router.get(
  "/tickets",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"]),
  validate(GetTicketsAdminSchema),
  adminController.getTickets,
);

//Ответить на тикет:
router.patch(
  "/tickets/:id/reply",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  validate(ReplyOnTicketAdminSchema),
  adminController.replyToTicket,
);

//Изменить статус тикета:
router.patch(
  "/tickets/:id/status",
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  validate(ChangeStatusOfTicketAdminSchema),
  adminController.updateTicketStatus,
);

//---------------------Контент:-------------
//Получение всех новостей:
router.get(
  "/news",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN", "WATCHER"]),
  adminController.getNews,
);

//Создать новость:
router.post(
  "/news",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  newsUpload.single("mainImage"),
  validate(CreateNewsSchema),
  adminController.createNews,
);

//Изменить новость:
router.patch(
  "/news/:id",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  newsUpload.single("mainImage"),
  validate(UpdateNewsSchema),
  adminController.updateNews,
);

//Удалить новость:
router.delete(
  "/news/:id",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  validate(DeleteNewsSchema),
  adminController.deleteNews,
);

//Обновить статус новости:
router.patch(
  "/news/:id/status",
  roleMiddleware(["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  validate(UpdateStatusNewsSchema),
  adminController.updateNewsStatus,
);

export default router;
