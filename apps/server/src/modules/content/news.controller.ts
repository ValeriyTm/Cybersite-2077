//Типы:
import { Request, Response } from "express";
//Новостной сервис модуля Content:
import { newsService } from "./news.service.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";

//Получить все опубликованные новости:
export const getAllPublished = catchAsync(
  async (_req: Request, res: Response) => {
    const news = await newsService.getAllPublished();
    res.json(news);
  },
);

//Получить конкретную новость:
export const getBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  //@ts-ignore:
  const article = await newsService.getBySlug(slug);

  if (!article) {
    throw new AppError(404, "Новость не найдена");
  }

  res.json(article);
});
