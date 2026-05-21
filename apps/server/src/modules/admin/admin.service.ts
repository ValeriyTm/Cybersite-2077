//Клиент призмы для работы с PostgreSQL:
import { OrderStatus, prisma } from "@repo/database";
//Модель взаимодействия с MongoDB (из модуля Content):
import { NewsModel } from "../content/index.js";

//Функция для генерации slug для модели мотоцикла:
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

export class AdminService {
  //---------------------Работа с остатками:-------------
  //Получение всех остатков:
  async getStocks(motoId: string) {
    return await prisma.stock.findMany({
      where: {
        motorcycleId: motoId ? String(motoId) : undefined,
      },
      include: {
        motorcycle: { select: { model: true } },
        warehouse: { select: { name: true, city: true } },
      },
      orderBy: { warehouse: { name: "asc" } },
    });
  }

  //Обновление остатков:
  async updateStock(id: string, quantity: number) {
    return await prisma.stock.update({
      where: { id },
      data: { quantity },
      select: { motorcycleId: true },
    });
  }

  //---------------------Управление доступом:-------------
  //Получить данные о юзерах:
  async getUsers(role: string, email: string, skip: number, limit: number) {
    const where: any = {};
    if (role) where.role = role;
    if (email) where.email = { contains: String(email), mode: "insensitive" };

    return await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          //  Не берем пароли и секреты
          id: true,
          email: true,
          name: true,
          phone: true,
          isActivated: true,
          role: true,
          createdAt: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
  }

  //Изменить роль юзеру:
  async updateUserRole(id: string, role: string) {
    return await prisma.user.update({
      where: { id },
      //@ts-ignore:
      data: { role },
    });
  }

  //Удалить юзера:
  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
  }

  //---------------------Контент:-------------
  //Получить список новостей:
  async getNews() {
    return await NewsModel.find().sort({ createdAt: -1 });
  }

  //Создать новость:
  async createNews(
    title: string,
    excerpt: string,
    content: string,
    status: string,
    tags: string[],
    //@ts-ignore:
    file: any,
    userId?: string,
  ) {
    return await NewsModel.create({
      title,
      excerpt,
      content: typeof content === "string" ? JSON.parse(content) : content,
      status,
      tags: Array.isArray(tags) ? tags : [],
      mainImage: file ? file.filename : "",
      slug: slugify(title),
      authorId: userId,
    });
  }

  //Обновить новость:
  async updateNews(id: string, preparedData: any) {
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

export const adminService = new AdminService();
