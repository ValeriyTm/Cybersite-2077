import { ReviewModel } from "./review.model.js";
import { prisma } from "@repo/database";
import { SearchService } from "../catalog/search.service.js";
import path from "path";
import * as fs from "node:fs";

const searchService = new SearchService();

export class ReviewService {
  async createReview(
    userId: string,
    userName: string,
    data: any,
    files: string[],
  ) {
    const { motorcycleId, orderId, rating, comment } = data;

    //1.Проверяем, был ли такой заказ и завершен ли он:
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId, status: "COMPLETED" }, //Статус должен быть COMPLETED
    });
    if (!order) throw new Error("Вы не можете оставить отзыв на этот товар");

    //2.Создаем отзыв в MongoDB:
    const review = await ReviewModel.create({
      userId,
      userName,
      motorcycleId,
      orderId,
      rating: Number(rating),
      comment,
      images: files,
    });

    //3.Обновляем рейтинг в PostgreSQ:
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

      //4.Синхронизируем новый рейтинг с ElasticSearch:
      await searchService.updateRatingInElastic(motorcycleId, newRating);
    }

    return review;
  }

  async getByMotorcycle(motorcycleId: string) {
    return ReviewModel.find({ motorcycleId }).sort({ createdAt: -1 });
  }

  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    //Ищем отзыв:
    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new Error("Отзыв не найден");

    //Проверка прав:
    if (review.userId !== userId && !isAdmin) {
      throw new Error("У вас нет прав на удаление этого отзыва");
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
