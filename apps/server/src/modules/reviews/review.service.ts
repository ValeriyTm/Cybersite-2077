//Модель для взаимодействия с MongoDB:
import { ReviewModel } from "./review.model.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Для работы с событиями:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Для работы с путями и файлами:
import path from "path";
import { promises as fs } from "fs";
//Санитайзинг пользовательсих данных:
import sanitizeHtml from "sanitize-html";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Импортируем поисковый сервис из модуля Catalog:
import { searchService } from "../catalog/index.js";
//Типы:
import { CreateReviewServiceArgs } from "@repo/validation";

export class ReviewService {
  //Создание отзыва:
  async createReview(
    userId: string,
    data: CreateReviewServiceArgs,
    files: string[],
  ) {
    const { motorcycleId, orderId, rating, comment } = data;

    //1.Проверяем, был ли такой заказ и завершен ли он:
    const order = await prisma.order.findFirst({
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
      userAvatar: user?.avatarUrl ?? "",
      motorcycleId,
      orderId,
      rating: Number(rating),
      comment: cleanComment, //Сохраняем в БД именно очищенный коммент
      images: files,
    });

    //6.Обновляем рейтинг в PostgreSQ:
    const currentMoto = await prisma.motorcycle.findUnique({
      where: { id: motorcycleId },
      select: { rating: true },
    });

    let updatedMoto = null;

    if (currentMoto) {
      if (rating > currentMoto.rating && currentMoto.rating < 5) {
        // Атомарно повышаем рейтинг на 0.1 прямо в базе данных
        updatedMoto = await prisma.motorcycle.update({
          where: { id: motorcycleId },
          data: { rating: { increment: 0.1 } },
        });
      } else if (rating < currentMoto.rating && currentMoto.rating > 0) {
        updatedMoto = await prisma.motorcycle.update({
          where: { id: motorcycleId },
          data: { rating: { decrement: 0.1 } },
        });
      }

      //7.Синхронизируем новый рейтинг с ElasticSearch:
      const finalRating = updatedMoto
        ? updatedMoto.rating
        : currentMoto?.rating || 0;

      await searchService.updateRatingInElastic(motorcycleId, finalRating);
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
    //Ищем отзыв в MongoDB:
    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new Error("Отзыв не найден");

    //Проверка прав:
    if (review.userId !== userId && !isAdmin) {
      throw new AppError(403, "У вас нет прав на удаление этого отзыва");
    }

    //Удаляем файлы изображений из отзыва:
    if (review.images && review.images.length > 0) {
      await Promise.allSettled(
        // Используем Promise.allSettled вместо Promise.all, чтобы падение удаления одного файла не прерывало удаление остальных файлов и самого отзыва
        review.images.map(async (imagePath) => {
          const fullPath = path.join(process.cwd(), imagePath);
          try {
            //Наш путь безопасен, поэтому можем успокоить линтер
            // eslint-disable-next-line
            await fs.unlink(fullPath);
          } catch (error: any) {
            // Игнорируем ошибку, если файл уже удален с диска
            if (error.code !== "ENOENT") throw error;
          }
        }),
      );
    }

    //Логика пересчета рейтинга:
    const currentMoto = await prisma.motorcycle.findUnique({
      where: { id: review.motorcycleId },
      select: { rating: true },
    });

    let updatedMoto = null;

    if (currentMoto) {
      //Через инкремент/декремент мы уходим от состояния race condition, которое могло бы возникнуть, если бы вели пересчет рейтинга в памяти, а затем записывали новое значение в БД
      if (review.rating < currentMoto.rating && currentMoto.rating < 5) {
        updatedMoto = await prisma.motorcycle.update({
          where: { id: review.motorcycleId },
          data: { rating: { increment: 0.1 } },
        });
      } else if (review.rating > currentMoto.rating && currentMoto.rating > 0) {
        updatedMoto = await prisma.motorcycle.update({
          where: { id: review.motorcycleId },
          data: { rating: { decrement: 0.1 } },
        });
      }
    }

    const finalRating = updatedMoto
      ? updatedMoto.rating
      : currentMoto?.rating || 0;

    //Синхронизация с ElasticSearch:
    await searchService.updateRatingInElastic(review.motorcycleId, finalRating);

    //Удаляем отзыв из MongoDB:
    return await ReviewModel.findByIdAndDelete(reviewId);
  }
}

export const reviewService = new ReviewService();
