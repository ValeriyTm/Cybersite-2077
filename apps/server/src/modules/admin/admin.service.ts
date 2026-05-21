//Клиент призмы для работы с PostgreSQL:
import { OrderStatus, prisma, TicketStatus } from "@repo/database";
//Модель взаимодействия с MongoDB (из модуля Content):
import { NewsModel } from "../content/index.js";
//Типы:
import {
  createMotorcycleAdminArgs,
  updateMotoAdminBodyArgs,
} from "@repo/validation";
//Взаимодействие с файлами и путями:
import { promises as fs } from "fs";
import * as path from "path";
import { da } from "@faker-js/faker";

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
  async createMotorcycle(
    data: createMotorcycleAdminArgs,
    files: Express.Multer.File[],
  ) {
    //Формируем slug: соединяем модель и год
    const year = data.year || new Date().getFullYear();
    const rawSlug = `${data.model}${year}`;
    const finalSlug = slugify(rawSlug);

    //Обрабатываем файлы и переименовываем их
    const imagePromises = (files || []).map(async (file, index) => {
      const extension = path.extname(file.originalname); // .jpg, .png
      // Формат: slug.jpg, slug-1.jpg, slug-2.jpg
      const newFileName =
        index === 0
          ? `${finalSlug}${extension}`
          : `${finalSlug}-${index}${extension}`;

      const oldPath = file.path;
      const newPath = path.join(path.dirname(oldPath), newFileName);

      try {
        //Асинхронно переименовываем файл на диске:
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await fs.rename(oldPath, newPath);
      } catch (err: any) {
        //Если файла не существовало (например, сбой загрузки Multer, т.е., например, массив files не пустой, но на самом диске файла физически не оказалось), игнорируем ошибку ENOENT.
        //Остальные системные ошибки пробрасываем дальше.
        if (err.code !== "ENOENT") throw err;
      }

      return {
        url: newFileName,
        isMain: index === 0,
      };
    });

    // Ждем, пока все файлы физически переименуются на диске:
    const imageRecords = await Promise.all(imagePromises);

    //Извлекаем из объекта поле "siteCategory":
    const { siteCategory, ...newData } = data;

    //Превращаем "siteCategory" в "siteCategoryId":
    const siteCategoryId = await prisma.siteCategory.findUnique({
      where: { name: siteCategory },
      select: { id: true },
    });

    return await prisma.motorcycle.create({
      data: {
        ...newData,
        siteCategoryId: siteCategoryId!.id,
        slug: finalSlug,
        price: Number(data.price) || 300000,
        year: Number(data.year) || new Date().getFullYear(),
        displacement: data.displacement ? Number(data.displacement) : 0,
        power: data.power ? Number(data.power) : null,
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
    rawData: updateMotoAdminBodyArgs,
    files: Express.Multer.File[],
    id: string,
    // mainImageId?: string,
    // deletedImageIds?: string[],
  ) {
    //1.Генерируем slug:
    let slug = rawData.slug;
    if (rawData.model || rawData.year) {
      // Подтягиваем текущие данные, если чего-то не хватает в запросе:
      const current = await prisma.motorcycle.findUnique({
        where: { id },
        select: { model: true, year: true },
      });
      const model = rawData.model || current?.model;
      const year = rawData.year || current?.year;
      slug = slugify(`${model}${year}`);
    }

    //2.Удаляем старые изображения:
    if (rawData.deletedImageIds && rawData.deletedImageIds.length > 0) {
      const imagesToDelete = await prisma.productImage.findMany({
        where: { id: { in: rawData.deletedImageIds } },
        select: { url: true },
      });

      await Promise.all(
        imagesToDelete.map(async (img) => {
          const filePath = path.resolve("uploads/motorcycles", img.url);
          try {
            //Eslint ругается, т.к. не знает, что мы формируем путь на сервере, а не на клиенте, поэтому:
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            await fs.unlink(filePath);
          } catch {
            console.log("Файл уже удален");
          }
        }),
      );
      await prisma.productImage.deleteMany({
        where: { id: { in: rawData.deletedImageIds } },
      });
    }

    //3.Обновляем главное изображение:
    if (rawData.mainImageId) {
      await prisma.productImage.updateMany({
        where: { motorcycleId: id },
        data: { isMain: false },
      });
      await prisma.productImage.update({
        where: { id: rawData.mainImageId },
        data: { isMain: true },
      });
    }

    //4.Узнаем, сколько картинок осталось в базе для этого байка, чтобы продолжить нумерацию (например, начать с "-3", если 3 уже есть)
    const existingImagesCount = await prisma.productImage.count({
      where: { motorcycleId: id },
    });
    //Добавляем новые файлы:
    const newImages = await Promise.all(
      files.map(async (file, index) => {
        const extension = path.extname(file.originalname);
        const newFileName = `${slug}-${existingImagesCount + index}${extension}`;
        const newPath = path.join(path.dirname(file.path), newFileName);

        try {
          //Eslint ругается, т.к. не знает, что мы формируем путь на сервере, а не на клиенте, поэтому:
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          await fs.rename(file.path, newPath);
        } catch {
          console.log("Ошибка перемещения");
        }
        return { url: newFileName, isMain: false };
      }),
    );

    //5.Извлекаем из объекта данных все лишние поля (также отключаем оповещения ESLint, что переменные далее не используются):
    const {
      // eslint-disable-next-line
      id: _ignoredId,
      siteCategory,
      // eslint-disable-next-line
      brand,
      // eslint-disable-next-line
      images,
      // eslint-disable-next-line
      createdAt,
      // eslint-disable-next-line
      updatedAt,
      // eslint-disable-next-line
      deletedImageIds: _d,
      // eslint-disable-next-line
      mainImageId: _m,
      // eslint-disable-next-line
      fuelConsumption,
      ...finalData
    } = rawData;

    //Превращаем "siteCategory" в "siteCategoryId":
    const siteCategoryId = await prisma.siteCategory.findUnique({
      where: { name: siteCategory },
      select: { id: true },
    });

    return await prisma.motorcycle.update({
      where: { id },
      data: {
        ...finalData,
        slug,
        siteCategoryId: siteCategoryId!.id,
        images: { create: newImages },
      },
      include: { images: true },
    });
  }

  //Удаление модели мотоцикла:
  async deleteMotorcycle(id: string) {
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
      data: { quantity },
      select: { motorcycleId: true },
    });
  }

  //---------------------Работа с заказами:-------------
  //Получить все заказы:
  async getOrders(
    skip: number,
    limit: number,
    status?: string,
    email?: string,
  ) {
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
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);
  }

  //Изменить статус заказа:
  async updateOrderStatus(id: string, status: OrderStatus) {
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
      //@ts-ignore:
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
