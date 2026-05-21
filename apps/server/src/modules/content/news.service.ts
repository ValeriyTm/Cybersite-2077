//Модель для взаимодействия с MongoDB:
import { NewsModel } from "../content/news.model.js";

type ContentFull = UpdateNewsBodyArgs & {
  mainImage?: string;
};

//Словарь для сопоставления русских и латинских букв:
const translitMap = new Map<string, string>([
  ["щ", "shh"],
  ["ш", "sh"],
  ["ч", "ch"],
  ["ц", "cz"],
  ["ю", "yu"],
  ["я", "ya"],
  ["ё", "yo"],
  ["ж", "zh"],
  ["ъ", "``"],
  ["ы", "y"],
  ["э", "e"],
  ["а", "a"],
  ["б", "b"],
  ["в", "v"],
  ["г", "g"],
  ["д", "d"],
  ["е", "e"],
  ["з", "z"],
  ["и", "i"],
  ["й", "j"],
  ["к", "k"],
  ["л", "l"],
  ["м", "m"],
  ["н", "n"],
  ["о", "o"],
  ["п", "p"],
  ["р", "r"],
  ["с", "s"],
  ["т", "t"],
  ["у", "u"],
  ["ф", "f"],
  ["х", "x"],
  ["ь", "`"],
]);
//Функция для генерации slug для имени новости (будет отображаться в адресной строке):
const transliterate = (text: string): string => {
  return text
    .split("")
    .map((char) => {
      const lowerChar = char.toLowerCase();
      // Метод .get() безопасен и не вызывает ворнингов линтера
      return translitMap.has(lowerChar) ? translitMap.get(lowerChar) : char;
    })
    .join("");
};

const slugify = (text: string) =>
  transliterate(text.toString())
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "") // Теперь \w отработает корректно, так как букв а-я уже нет
    .replace(/--+/g, "-")
    .replace(/^-/, "") // Удаляет дефис в начале
    .replace(/-$/, ""); // Удаляет дефис в конце

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

  //Получить список новостей (в админке):
  async getNews() {
    return await NewsModel.find().sort({ createdAt: -1 });
  }

  //Создать новость:
  async createNews(dto: {
    title: string;
    excerpt: string;
    content: string;
    status: string;
    file: Express.Multer.File | undefined;
    tags?: string[];
    userId?: string;
  }) {
    return await NewsModel.create({
      title: dto.title,
      excerpt: dto.excerpt,
      content:
        typeof dto.content === "string" ? JSON.parse(dto.content) : dto.content,
      status: dto.status,
      tags: Array.isArray(dto.tags) ? dto.tags : [],
      mainImage: dto.file ? dto.file.filename : "",
      slug: slugify(dto.title),
      authorId: dto.userId,
    });
  }

  //Обновить новость:
  async updateNews(id: string, preparedData: ContentFull) {
    return await NewsModel.findByIdAndUpdate(id, preparedData, {
      new: true,
    });
  }

  //Удалить новость:
  async deleteNews(id: string) {
    await NewsModel.findByIdAndDelete(id);
  }

  //Изменить статус новости:
  async updateNewsStatus(id: string, status: string) {
    return await NewsModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }, //Возвращаем обновленный документ
    );
  }
}

export const newsService = new NewsService();
