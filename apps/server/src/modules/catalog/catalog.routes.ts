import { Router } from "express";
//Главный контроллер модуля Catalog:
import * as catalogController from "./catalog.controller.js";
//Middleware:
import { optionalAuth } from "../../shared/middlewares/optionalAuthMiddleware.js"; //Опциональная авторизация

const router = Router();

//Генерация актуального sitemap.xml (/api/catalog/sitemap.xml):
router.get("/sitemap.xml", catalogController.getSitemap);
//Получение главных категорий (/api/catalog/categories):
router.get("/categories", catalogController.getCategories);
//Список брендов с пагинацией для страницы (/api/catalog/brands?page=1&limit=20):
router.get("/brands", catalogController.getBrands);
//Получение всех мотоциклов одного бренда (/api/catalog/motorcycles):
router.get(
  "/motorcycles",
  //@ts-ignore:
  optionalAuth,
  catalogController.getMotorcycles,
);
//Поиск с выводом предположений:
router.get("/search/suggest", catalogController.getSuggestions);
//Получение аналогичных мотоциклов (рекомендации) (/api/catalog/motorcycles/:slug/related):
router.get(
  "/motorcycles/:slug/related",
  //@ts-ignore:
  optionalAuth,
  catalogController.getRelated,
);
//Получение информации о конкретном мотоцикле по slug (/api/catalog/motorcycles/:brandSlug/:slug):
router.get(
  "/motorcycles/:brandSlug/:slug",
  //@ts-ignore:
  optionalAuth,
  catalogController.getMotorcycle,
); //Добавили опциональную авторизацию, чтобы получать токен и на его основе выводить персонализированную скидку
//Получение информации о конкретном мотоцикле по id (/api/catalog/motorcycles/:id):
router.get(
  "/motorcycles/:id",
  //@ts-ignore:
  optionalAuth,
  catalogController.getMotorcycleById,
);

//Временный роут для ручного запуска синхронизации
//(http://localhost:3001/api/catalog/sync-search):
router.get("/sync-search", catalogController.syncAllMotorcycles);
//Не забывать перед каждой синхронизацией удалять старые данные DELETE-запросом на http://localhost:9200/motorcycles

export default router;
