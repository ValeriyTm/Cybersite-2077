import { Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { ReviewModel } from "./review.model.js";
import { AuthRequest } from "../../shared/middlewares/auth.middleware.js";
import * as fs from "node:fs";

export const validateReviewAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.body;

    //Функция для удаления файлов, если проверка не пройдена:
    const cleanup = () => {
      if (req.files) {
        (req.files as Express.Multer.File[]).forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
    };

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user.id, status: "COMPLETED" },
    });

    if (!order) {
      cleanup(); //Стираем файлы
      return res.status(403).json({ message: "Заказ не завершен или не ваш" });
    }

    const existingReview = await ReviewModel.findOne({ orderId });
    if (existingReview) {
      cleanup(); //Стираем файлы
      return res.status(400).json({ message: "Отзыв уже существует" });
    }

    next();
  } catch (e) {
    next(e);
  }
};
