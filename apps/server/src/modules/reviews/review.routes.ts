import { Router } from "express";
import * as reviewController from "./review.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { uploadReviewImages } from "src/lib/storage.js";
import { validateReviewAccess } from "./review.middleware.js";

const router = Router();

//Создание отзыва:
router.post(
  "/",
  authMiddleware, //Проверяем авторизацию
  uploadReviewImages, //Загружаем изображения. Multer заполнит req.body
  validateReviewAccess, //Проверяем, что отзыв ещё не оставлялся
  reviewController.createReview, //Оставляем отзыв
);
//Получить все отзывы для конкретной модели мотоцикла:
router.get("/:motorcycleId", reviewController.getMotorcycleReviews);
//Удалить отзыв:
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);

export default router;
