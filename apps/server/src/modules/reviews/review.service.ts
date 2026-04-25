//Модель для взаимодействия с MongoDB:
import { ReviewModel } from "./review.model.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Для работы с событиями:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Для работы с путями и файлами:
import path from "path";
import * as fs from "node:fs";
//Санитайзинг пользовательсих данных:
import sanitizeHtml from "sanitize-html";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Импортируем поисковый сервис из модуля Catalog:
import { searchService } from "../catalog/index.js";

export class ReviewService {
  //Создание отзыва:
  async createReview(
    userId: string,
    // @ts-ignore:
    userName: string,
    data: any,
    files: string[],
  ) {
    const { motorcycleId, orderId, rating, comment } = data;

    //1.Проверяем, был ли такой заказ и завершен ли он:
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId, status: "COMPLETED" }, //Статус должен быть COMPLETED
    });
    if (!order) {
      throw new AppError(403, "Вы не можете оставить отзыв на этот товар");
    }

    //2.Проверяем размер комментария:
    if (comment.length < 5 || comment.length > 2000) {
      throw new Error("Комментарий должен быть от 5 до 2000 символов");
    }

    //3.Производим очистку (санитайзинг) комментария юзера:
    const cleanComment = sanitizeHtml(comment, {
      allowedTags: [], // Запрещаем любые HTML-теги
      allowedAttributes: {},
    });

    //4.Добавляем в модель Mongo поле userAvatar (из базы Postgres):
    const user = await prisma.user.findUnique({ where: { id: userId } });

    //5.Создаем отзыв в MongoDB:
    const review = await ReviewModel.create({
      userId,
      userName: user?.name,
      // @ts-ignore:
      userAvatar: user?.avatarUrl,
      motorcycleId,
      orderId,
      rating: Number(rating),
      comment: cleanComment, //Сохраняем в БД имено очищенный коммент
      images: files,
    });

    //6.Обновляем рейтинг в PostgreSQ:
    const moto = await prisma.motorcycle.findUnique({
      where: { id: motorcycleId },
    });
    if (moto) {
      let newRating = moto.rating;
      const userRating = Number(rating);

      //Если юзер выставил рейтинг меньше того, что сейчас в БД, то понижаем его на 0.1:
      if (userRating < moto.rating) {
        newRating = Math.max(1, moto.rating - 0.1);
      } else if (userRating > moto.rating) {
        newRating = Math.min(5, moto.rating + 0.1);
        //Если юзер выставил рейтинг выше того, что сейчас в БД, то повышаем его на 0.1:
      }

      await prisma.motorcycle.update({
        where: { id: motorcycleId },
        data: { rating: newRating },
      });

      //7.Синхронизируем новый рейтинг с ElasticSearch:
      await searchService.updateRatingInElastic(motorcycleId, newRating);
    }

    //8.Создаём событие для генерации оповещения в ТГ:
    eventBus.emit(EVENTS.REVIEW_ADDED, review);

    return review;
  }

  //Получение отзывов по мотоциклу:
  async getByMotorcycle(motorcycleId: string) {
    return ReviewModel.find({ motorcycleId }).sort({ createdAt: -1 });
  }

  //Удаление отзыва:
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    //Ищем отзыв:
    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new Error("Отзыв не найден");

    //Проверка прав:
    if (review.userId !== userId && !isAdmin) {
      throw new AppError(403, "У вас нет прав на удаление этого отзыва");
    }

    //Удаляем файлы изображений из отзыва:
    if (review.images && review.images.length > 0) {
      review.images.forEach((imagePath) => {
        const fullPath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
    }

    //Логика пересчета рейтинга:
    const moto = await prisma.motorcycle.findUnique({
      where: { id: review.motorcycleId },
    });

    if (moto) {
      let newRating = moto.rating;
      if (review.rating < moto.rating) {
        newRating = Math.min(5, moto.rating + 0.1);
      } else if (review.rating > moto.rating) {
        newRating = Math.max(1, moto.rating - 0.1);
      }

      await prisma.motorcycle.update({
        where: { id: review.motorcycleId },
        data: { rating: newRating },
      });

      //Синхронизация с ElasticSearch:
      await searchService.updateRatingInElastic(review.motorcycleId, newRating);
    }

    //Удаляем из MongoDB:
    return await ReviewModel.findByIdAndDelete(reviewId);
  }
}

export const reviewService = new ReviewService();
