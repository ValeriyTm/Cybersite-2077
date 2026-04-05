import { Router } from "express";
import * as reviewController from "./review.controller.js";
import { authMiddleware } from "src/shared/middlewares/auth.middleware.js";
import { uploadReviewImages } from "src/lib/storage.js";

const router = Router();

//Создание отзыва:
router.post(
  "/",
  authMiddleware,
  uploadReviewImages,
  reviewController.createReview,
);
//Получить все отзывы для конкретной модели мотоцикла:
router.get("/:motorcycleId", reviewController.getMotorcycleReviews);

export default router;
