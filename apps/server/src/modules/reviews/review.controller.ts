import { Response, NextFunction } from "express";
import { reviewService } from "./review.service.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";

export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId, motorcycleId, rating, comment } = req.body;

    //Собираем пути к файлам из Multer:
    const files = ((req.files as Express.Multer.File[]) || []).map(
      (file) => `/uploads/reviews/${file.filename}`,
    );

    const review = await reviewService.createReview(
      req.user.id,
      req.user.name, //Имя юзера для отображения в отзыве
      { orderId, motorcycleId, rating, comment },
      files,
    );

    res.status(201).json(review);
  } catch (e) {
    next(e);
  }
};

export const getMotorcycleReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { motorcycleId } = req.params;
    const reviews = await reviewService.getByMotorcycle(motorcycleId);
    res.json(reviews);
  } catch (e) {
    next(e);
  }
};
