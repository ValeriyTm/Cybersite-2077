//------------------------------Middleware для отсечения отзывов на не свой заказ и на не завершенный заказ
//Типы:
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/middlewares/auth.middleware.js";
//Модель для взаимодействия с MongoDB:
import { ReviewModel } from "./review.model.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Для работы с файлами:
import fs from "node:fs/promises";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

export const validateReviewAccess = catchAsync(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const { orderId } = req.body;

    //Функция для удаления файлов, если проверка не пройдена:
    const cleanup = async () => {
      if (req.files && Array.isArray(req.files)) {
        const deletePromises = (req.files as Express.Multer.File[]).map(
          (file) =>
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            fs
              .unlink(file.path)
              .catch((err) =>
                console.error(`Ошибка удаления файла ${file.path}:`, err),
              ),
        );
        await Promise.all(deletePromises);
      }
    };

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user.id, status: "COMPLETED" },
    });

    if (!order) {
      cleanup(); //Стираем файлы
      throw new AppError(403, "Заказ не завершен или не ваш");
    }

    const existingReview = await ReviewModel.findOne({ orderId });
    if (existingReview) {
      cleanup(); //Стираем файлы
      throw new AppError(400, "Отзыв уже существует");
    }

    next();
  },
);
