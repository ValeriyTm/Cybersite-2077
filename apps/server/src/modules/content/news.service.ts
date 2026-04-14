//Модель для взаимодействия с MongoDB:
import { NewsModel } from "../content/news.model.js";

export class NewsService {
  //Получить все опубликованные новости:
  async getAllPublished() {
    return await NewsModel.find({ status: "PUBLISHED" })
      .sort({ createdAt: -1 }) //Сначала свежие
      .select("-content"); //Оптимизация: для списка не тянем тяжелый массив блоков
  }

  //Получить конкретную новость:
  async getBySlug(slug: string) {
    return await NewsModel.findOne({ slug, status: "PUBLISHED" });
  }
}

export const newsService = new NewsService();
