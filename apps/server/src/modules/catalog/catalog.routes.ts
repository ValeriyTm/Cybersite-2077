import { Router } from "express";
//Главный контроллер модуля Catalog:
import * as catalogController from "./catalog.controller.js";
//Middleware:
import { optionalAuth } from "../../shared/middlewares/optionalAuthMiddleware.js"; //Опциональная авторизация
import { validate } from "../../shared/middlewares/validate.js";
import { roleMiddleware } from "src/shared/middlewares/roleMiddleware.js";
import { authMiddleware } from "src/shared/middlewares/authMiddleware.js";
//Схемы валидации:
import {
  GetBrandsQuerySchema,
  GetMotoBySlugSchema,
  GetMotorcyclesQuerySchema,
  GetRelatedBySlugSchema,
  GetSuggestionsQuerySchema,
} from "@repo/validation";

const router = Router();

//Генерация актуального sitemap.xml (/api/catalog/sitemap.xml):
router.get("/sitemap.xml", catalogController.getSitemap);

//Получение главных категорий (/api/catalog/categories):
router.get("/categories", catalogController.getCategories);

//Список брендов с пагинацией для страницы (/api/catalog/brands):
router.get(
  "/brands",
  validate(GetBrandsQuerySchema),
  catalogController.getBrands,
);

//Получение всех мотоциклов одного бренда (/api/catalog/motorcycles):
router.get(
  "/motorcycles",
  validate(GetMotorcyclesQuerySchema),
  optionalAuth,
  catalogController.getMotorcycles,
);

//Поиск с выводом предположений:
router.get(
  "/search/suggest",
  validate(GetSuggestionsQuerySchema),
  catalogController.getSuggestions,
);

//Получение аналогичных мотоциклов (рекомендации) (/api/catalog/motorcycles/:slug/related):
router.get(
  "/motorcycles/:slug/related",
  validate(GetRelatedBySlugSchema),
  optionalAuth,
  catalogController.getRelated,
);

//Получение информации о конкретном мотоцикле по slug (/api/catalog/motorcycles/:brandSlug/:slug):
router.get(
  "/motorcycles/:brandSlug/:slug",
  validate(GetMotoBySlugSchema),
  optionalAuth,
  catalogController.getMotorcycle,
); //Добавили опциональную авторизацию, чтобы получать токен и на его основе выводить персонализированную скидку

//Получение информации о конкретном мотоцикле по id (/api/catalog/motorcycles/:id):
// router.get(
//   "/motorcycles/:id",
//   optionalAuth,
//   catalogController.getMotorcycleById,
// );

//Временный роут для ручного запуска синхронизации
//(http://localhost:3001/api/catalog/sync-search):
router.get(
  "/sync-search",
  authMiddleware,
  roleMiddleware(["MANAGER", "ADMIN", "SUPERADMIN"]),
  catalogController.syncAllMotorcycles,
);
//Не забывать перед каждой синхронизацией удалять старые данные DELETE-запросом на http://localhost:9200/motorcycles

export default router;
