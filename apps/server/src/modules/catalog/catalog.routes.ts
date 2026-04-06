import { Router } from "express";
import * as catalogController from "./catalog.controller.js";
import { optionalAuth } from "src/shared/middlewares/optionalAuthMiddleware.js";
import { searchService } from "./search.service.js";

const router = Router();

//Для получения sitemap.xml:
//(должно быть доступно по адресу домен/api/catalog/sitemap.xml):
router.get("/sitemap.xml", catalogController.getSitemap);
//Получение главных категорий (/api/catalog/categories):
router.get("/categories", catalogController.getCategories);
//Список брендов с пагинацией для страницы (/api/catalog/brands?page=1&limit=20):
router.get("/brands", catalogController.getBrands);
//Получение всех мотоциклов одного бренда (/api/catalog/motorcycles):
router.get("/motorcycles", catalogController.getMotorcycles);

//Временный роут для ручного запуска синхронизации
//(http://localhost:3001/api/catalog/sync-search):
router.get("/sync-search", async (req, res, next) => {
  try {
    await searchService.syncAllMotorcycles();
    res.send("Синхронизация завершена! Проверь консоль бэкенда.");
  } catch (error) {
    next(error); // Пробрасываем ошибку в глобальный обработчик
  }
});
//Не забывать перед каждой синхронизацией удалять старые данные DELETE-запросом на http://localhost:9200/motorcycles

//Поиск с выводом предположений:
router.get("/search/suggest", catalogController.getSuggestions);
//Получение аналогичных мотоциклов (рекомендации) (/api/catalog/motorcycles/:slug/related):
router.get(
  "/motorcycles/:slug/related",
  optionalAuth,
  catalogController.getRelated,
);
//Получение информации о конкретном мотоцикле (/api/catalog/motorcycles/:brandSlug/:slug):
router.get(
  "/motorcycles/:brandSlug/:slug",
  optionalAuth,
  catalogController.getMotorcycle,
); //Добавили опциональную авторизацию, чтобы получать токен и на его основе выводить персонализированную скидку

export default router;
