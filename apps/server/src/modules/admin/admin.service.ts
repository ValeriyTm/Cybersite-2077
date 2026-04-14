//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Модель взаимодействия с MongoDB (из модуля Content):
import { NewsModel } from "../content/index.js";
//Взаимодействие с файлами и путями:
import fs from "fs";
import path from "path";

//Функция для генерации slug для модели мотоцикла:
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

export interface CreateMotorcycleDto {
  model: string;
  brandId: string;
  price: string | number;
  year: string | number;
  category: string;
  description?: string;
  displacement?: string | number;
  power?: string | number;
  topSpeed?: string | number;
  fuelConsumption?: string | number;
  colors?: string[];
  files?: Express.Multer.File[]; // Для обработки картинок
}

export class AdminService {
  //---------------------Работа с брендами:-------------
  //Получить все бренды:
  async getBrands(search: string, skip: number, limit: number) {
    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where: {
          name: { contains: String(search), mode: "insensitive" },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.brand.count({
        where: { name: { contains: String(search), mode: "insensitive" } },
      }),
    ]);

    return { brands, total };
  }

  //Удалить бренд:
  async deleteBrand(id: string) {
    //Находим все связанные модели мотоциклов перед удалением:
    const affectedMotos = await prisma.motorcycle.findMany({
      where: { brandId: id },
      select: { id: true },
    });

    await prisma.brand.delete({ where: { id } });

    return affectedMotos;
  }

  //Создать бренд:
  async createBrand(name: string, country: string, slug: string) {
    return await prisma.brand.create({
      data: { name, country, slug },
    });
  }

  //Обновление информации о бренде:
  async updateBrand(id: string, name: string, country: string, slug: string) {
    const oldBrand = await prisma.brand.findUnique({ where: { id } });
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { name, country, slug },
    });
    return { oldBrand, updatedBrand };
  }
  //---------------------Работа с мотоциклами:-------------
  //Поиск брендов:
  async searchBrands(query: string) {
    return await prisma.brand.findMany({
      where: {
        name: { contains: String(query), mode: "insensitive" },
      },
      take: 10,
      select: { id: true, name: true },
    });
  }

  //Получение информации о всех моделях мотоциклов:
  async getMotorcycles(ids: string[]) {
    return await prisma.motorcycle.findMany({
      where: { id: { in: ids } },
      include: { brand: { select: { name: true } }, images: true },
      //skip и take здесь не нужны, так как Elastic уже отфильтровал нужные 10 штук
    });
  }

  //Создание новой модели мотоцикла:
  async createMotorcycle(dto: CreateMotorcycleDto) {
    const { files, ...data } = dto;

    //Формируем slug: соединяем модель и год
    const year = data.year || new Date().getFullYear();
    const rawSlug = `${data.model}${year}`;
    const finalSlug = slugify(rawSlug);

    //Обрабатываем файлы и переименовываем их
    const imageRecords = files?.map((file, index) => {
      const extension = path.extname(file.originalname); // .jpg, .png
      // Формат: slug.jpg, slug-1.jpg, slug-2.jpg
      const newFileName =
        index === 0
          ? `${finalSlug}${extension}`
          : `${finalSlug}-${index}${extension}`;

      const oldPath = file.path;
      const newPath = path.join(path.dirname(oldPath), newFileName);

      //Физически переименовываем файл на диске
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }

      return {
        url: newFileName,
        isMain: index === 0,
      };
    });

    return await prisma.motorcycle.create({
      data: {
        ...data,
        slug: finalSlug,
        price: Number(data.price) || 300000,
        year: Number(data.year) || new Date().getFullYear(),
        displacement: data.displacement ? Number(data.displacement) : null,
        power: data.power ? Number(data.power) : null,
        topSpeed: data.topSpeed ? Number(data.topSpeed) : null,
        fuelConsumption: data.fuelConsumption
          ? Number(data.fuelConsumption)
          : null,
        rating: 0,
        colors: Array.isArray(data.colors) ? data.colors : [],
        images: {
          create: imageRecords,
        },
      },
      include: { images: true, brand: true },
    });
  }

  //Обновление данных о модели мотоцикла:
  async updateMotorcycle(
    rawData: any,
    files: Express.Multer.File[],
    deletedImageIds: string[],
    mainImageId: string,
    id: string,
  ) {
    //Очистка данных:
    const data: any = {};
    Object.keys(rawData).forEach((key) => {
      const value = rawData[key];

      //Заменяем NaN или строку "null" на реальный null
      if (Number.isNaN(value) || value === "NaN" || value === "null") {
        data[key] = null;
      } else if (
        [
          "price",
          "year",
          "displacement",
          "power",
          "topSpeed",
          "fuelConsumption",
        ].includes(key)
      ) {
        // Принудительно конвертируем в число, если поле должно быть числом
        data[key] = value !== "" ? Number(value) : null;
      } else {
        data[key] = value;
      }
    });

    let updateData: any = { ...data };
    if (data.model || data.year) {
      // Подтягиваем текущие данные, если чего-то не хватает в запросе
      const current = await prisma.motorcycle.findUnique({ where: { id } });
      const model = data.model || current?.model;
      const year = data.year || current?.year;
      updateData.slug = slugify(`${model}${year}`);
    }

    //Удаляем помеченные изображения
    if (deletedImageIds) {
      const idsArray = Array.isArray(deletedImageIds)
        ? deletedImageIds
        : [deletedImageIds];

      //Находим файлы, чтобы удалить их с диска
      const imagesToDelete = await prisma.productImage.findMany({
        where: { id: { in: idsArray } },
      });

      for (const img of imagesToDelete) {
        const filePath = path.resolve("uploads/motorcycles", img.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await prisma.productImage.deleteMany({
        where: { id: { in: idsArray } },
      });
    }

    //Обновляем статус "Главная"
    if (mainImageId) {
      await prisma.productImage.updateMany({
        where: { motorcycleId: id },
        data: { isMain: false },
      });
      await prisma.productImage.update({
        where: { id: mainImageId },
        data: { isMain: true },
      });
    }

    //Узнаем, сколько картинок осталось в базе для этого байка, чтобы продолжить нумерацию (например, начать с "-3", если 3 уже есть)
    const existingImagesCount = await prisma.productImage.count({
      where: { motorcycleId: id },
    });

    //Добавляем новые файлы
    const newImages = files.map((file, index) => {
      const extension = path.extname(file.originalname);
      //Формируем имя: slug-N.jpg
      const newFileName = `${updateData.slug}-${existingImagesCount + index}${extension}`;

      const oldPath = file.path;
      const newPath = path.join(path.dirname(oldPath), newFileName);

      //Физически переименовываем файл на диске
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }

      return {
        url: newFileName,
        isMain: false,
      };
    });

    return await prisma.motorcycle.update({
      where: { id },
      data: {
        ...updateData,
        price: data.price ? Number(data.price) : 0,
        year: Number(data.year) || new Date().getFullYear(),
        colors: Array.isArray(data.colors) ? data.colors : [],
        power: data.power ? Number(data.power) : null,
        topSpeed: data.topSpeed ? Number(data.topSpeed) : null,
        fuelConsumption: data.fuelConsumption
          ? Number(data.fuelConsumption)
          : null,
        rating: data.rating ? Number(data.rating) : 0,
        displacement: data.displacement ? Number(data.displacement) : undefined,
        images: { create: newImages },
      },
      include: { images: true },
    });
  }

  //Удаление модели мотоцикла:
  async deleteMotorcycle(id) {
    await prisma.motorcycle.delete({ where: { id } });
  }

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
      data: {
        //  Принудительно приводим к числу и проверяем на валидность
        quantity: !isNaN(Number(quantity)) ? Number(quantity) : 0,
      },
      select: { motorcycleId: true },
    });
  }

  //---------------------Работа с заказами:-------------
  //Получить все заказы:
  async getOrders(status: string, email: string, skip: number, limit: number) {
    //Формируем фильтры:
    const where: any = {};
    if (status) where.status = status;
    if (email) {
      where.user = {
        email: { contains: String(email), mode: "insensitive" },
      };
    }

    return await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
          items: {
            include: {
              motorcycle: { select: { model: true } },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);
  }

  //Изменить статус заказа:
  async updateOrderStatus(id: string, status: string) {
    return await prisma.order.update({
      where: { id },
      data: { status },
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
      data: { role },
    });
  }

  //Удалить юзера:
  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
  }

  //---------------------Скидки и промокоды:-------------
  //Получаем промокоды:
  async getPromoCodes() {
    return await prisma.promoCode.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  //Поулчаем персональные скидки:
  async getPersonalDiscounts(email: string) {
    return await prisma.personalDiscount.findMany({
      where: email
        ? {
            user: {
              email: { contains: String(email), mode: "insensitive" }, // Поиск без учета регистра
            },
          }
        : {},
      include: {
        user: { select: { email: true } },
        motorcycle: { select: { model: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  //---------------------Тикеты поддержки:-------------
  //Получение всех тикетов:
  async getTickets(status: string, email: string, skip: number, l: number) {
    const where: any = {};
    if (status) where.status = status;
    if (email) {
      where.email = { contains: String(email), mode: "insensitive" };
    }

    return await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          attachments: true,
          user: { select: { email: true, name: true } },
        },
        skip,
        take: l,
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.count({ where }),
    ]);
  }

  //Дать ответ на тикет:
  async replyToTicket(id: string, answer: string) {
    return await prisma.supportTicket.update({
      where: { id },
      data: {
        answer,
        status: "RESOLVED",
        answeredAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  //Изменить статус тикета:
  async updateTicketStatus(id: string, status: string) {
    return await prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
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
