import { Router } from "express";
//Основной контроллер модуля Reviews:
import * as reviewController from "./review.controller.js";
//Middleware:
import { authMiddleware } from "../../shared/middlewares/authMiddleware.js"; //Проверка авторизации
import { uploadReviewImages } from "./upload.js"; //Middleware для загрузки файлов на сервер на основе Multer
import { validateReviewAccess } from "./review.middleware.js"; //Middleware для отсечения повторных отзывов, а также отзывов на не свой заказ и на не завершенный заказ
import { noCacheMiddleware } from "../../shared/middlewares/noCacheMiddleware.js"; //Запрещаем кэширование страниц браузером
import { validate } from "../../shared/middlewares/validate.js";
//Схемы валидации:
import {
  CreateReviewSchema,
  DeleteReviewSchema,
  GetReviewSchema,
} from "@repo/validation";

const router = Router();

//Создание отзыва:
router.post(
  "/",
  authMiddleware, //Проверяем авторизацию
  noCacheMiddleware, //Запрещаем кэширование
  uploadReviewImages.array("images", 5), //Загружаем на сервер изображения для отзыва
  validate(CreateReviewSchema),
  validateReviewAccess, //Проверяем, что отзыв ещё не оставлялся и что его вообще допусткается оставить
  reviewController.createReview, //Оставляем отзыв
);

//Получить все отзывы для конкретной модели мотоцикла:
router.get(
  "/:motorcycleId",
  validate(GetReviewSchema),
  reviewController.getMotorcycleReviews,
);

//Удалить отзыв:
router.delete(
  "/:reviewId",
  authMiddleware,
  noCacheMiddleware,
  validate(DeleteReviewSchema),
  reviewController.deleteReview,
);

export default router;
