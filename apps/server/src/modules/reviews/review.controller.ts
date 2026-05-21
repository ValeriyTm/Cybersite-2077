//Типы:
import { Response, Request } from "express";
import { AuthRequest } from "../../shared/middlewares/authMiddleware.js";
//Главный сервис модуля Review:
import { reviewService } from "./review.service.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
//Типы:
import {
  CreateReviewServiceArgs,
  DeleteReviewServiceArgs,
  GetReviewServiceArgs,
} from "@repo/validation";

//Контроллер создания отзыва (на странице заказов):
export const createReview = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { orderId, motorcycleId, rating, comment } =
      req.body as CreateReviewServiceArgs;

    //Собираем пути к файлам из Multer:
    const files = ((req.files as Express.Multer.File[]) || []).map(
      (file) => `/static/reviews/${file.filename}`,
    );

    const review = await reviewService.createReview(
      req.user.id,
      { orderId, motorcycleId, rating, comment },
      files,
    );

    res.status(201).json(review);
  },
);

//Контроллер получения всех отзывов для конкретного мотоцикла:
export const getMotorcycleReviews = catchAsync(
  async (req: Request, res: Response) => {
    const { motorcycleId } = req.params as GetReviewServiceArgs;

    const reviews = await reviewService.getByMotorcycle(motorcycleId);
    res.json(reviews);
  },
);

//Контроллер удаления отзыва:
export const deleteReview = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { reviewId } = req.params as DeleteReviewServiceArgs;
    //Является ли юзер админом:
    const isAdmin = req.user.role === "ADMIN" || req.user.role === "SUPERADMIN";

    const result = await reviewService.deleteReview(
      reviewId,
      req.user.id,
      isAdmin,
    );

    res.json({ message: "Отзыв успешно удален", id: result?._id });
  },
);
