import { NewsModel } from "../content/news.model.js";
import { Request, Response, NextFunction } from "express";

export class NewsController {
  //Получить все опубликованные новости:
  static async getAllPublished(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const news = await NewsModel.find({ status: "PUBLISHED" })
        .sort({ createdAt: -1 }) //Сначала свежие
        .select("-content"); //Оптимизация: для списка не тянем тяжелый массив блоков

      res.json(news);
    } catch (e) {
      next(e);
    }
  }

  //Получить конкретную новость:
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const article = await NewsModel.findOne({ slug, status: "PUBLISHED" });

      if (!article)
        return res.status(404).json({ message: "Новость не найдена" });
      res.json(article);
    } catch (e) {
      next(e);
    }
  }
}
