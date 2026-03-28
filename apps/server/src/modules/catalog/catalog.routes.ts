import { Router } from "express";
import { catalogController } from "./catalog.controller.js";

import { searchService } from "./search.service.js";

const router = Router();

//Получение главных категорий (/api/catalog/categories):
router.get("/categories", catalogController.getCategories);
//Список брендов с пагинацией для страницы (/api/catalog/brands?page=1&limit=20):
router.get("/brands", catalogController.getBrands);
//Временный роут для ручного запуска синхронизации:
router.get("/sync-search", async (req, res, next) => {
  try {
    await searchService.syncAllMotorcycles();
    res.send("Синхронизация завершена! Проверь консоль бэкенда.");
  } catch (error) {
    next(error); // Пробрасываем ошибку в глобальный обработчик
  }
});

export default router;
