import { Router } from "express";
//Основной контроллер модуля Reviews:
import * as reviewController from "./review.controller.js";
//Middleware:
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js"; //Проверка авторизации
import { uploadReviewImages } from "./upload.js"; //Middleware для загрузки файлов на сервер на основе Multer
import { validateReviewAccess } from "./review.middleware.js"; //Middleware для отсечения повторных отзывов, а также отзывов на не свой заказ и на не завершенный заказ
import { noCacheMiddleware } from "src/shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером

const router = Router();

//Создание отзыва:
router.post(
  "/",
  authMiddleware, //Проверяем авторизацию
  noCacheMiddleware, //Запрещаем кэширование
  uploadReviewImages.array("images", 5), //Загружаем на сервер изображения для отзыва
  validateReviewAccess, //Проверяем, что отзыв ещё не оставлялся и что его вообще допусткается оставить
  reviewController.createReview, //Оставляем отзыв
);
//Получить все отзывы для конкретной модели мотоцикла:
router.get("/:motorcycleId", reviewController.getMotorcycleReviews);
//Удалить отзыв:
router.delete(
  "/:reviewId",
  authMiddleware,
  noCacheMiddleware,
  reviewController.deleteReview,
);

export default router;
