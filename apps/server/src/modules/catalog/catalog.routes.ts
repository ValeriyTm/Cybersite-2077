import { Router } from "express";
import { catalogController } from "./catalog.controller.js";

import { searchService } from "./search.service.js";

const router = Router();

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

//Получение информации о конкретном мотоцикле (/api/catalog/:brandSlug/:slug):
router.get("/:brandSlug/:slug", catalogController.getMotorcycle);

export default router;
