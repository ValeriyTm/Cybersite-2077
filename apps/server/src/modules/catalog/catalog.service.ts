//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Логика расчёта цены с учетом скидок (из модуля Discount):
import { discountLogic } from "../discount/index.js";
//Сервис поиска:
import { searchService } from "./search.service.js";
//Схемы валидации Zod:
import {
  createMotorcycleAdminArgs,
  GetBrandsArgs,
  updateMotoAdminBodyArgs,
} from "@repo/validation";
//Взаимодействие с файлами и путями:
import { promises as fs } from "fs";
import * as path from "path";
//Логирование:
import { logger } from "src/shared/lib/logger.js";

//Функция для генерации slug для модели мотоцикла:
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

export class CatalogService {
  //Получение основных категорий приложения:
  async getSiteCategories() {
    return await prisma.siteCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        description: true,
        _count: {
          select: { motorcycles: true }, //Считаем общее кол-во товаров в категории
        },
      },
      orderBy: { name: "asc" },
    });
  }

  //Получение данных о конкретном мотоцикле по его slug:
  async getMotorcycleBySlug(slug: string, userId?: string) {
    //Достаем из БД все данные о мотоцикле:
    const moto = await prisma.motorcycle.findUnique({
      where: { slug },
      include: {
        brand: true,
        siteCategory: true,
        images: true, //Галерея изображений
        //Подтягиваем остатки со всех складов:
        stocks: {
          select: { quantity: true, reserved: true },
        },
      },
    });

    if (!moto) return null;

    //Остатки товара:
    const totalInStock = moto.stocks.reduce(
      (acc, s) => acc + (s.quantity - s.reserved),
      0,
    );

    //Считаем скидку:
    const discountData = await discountLogic.calculateFinalPrice(moto, userId);

    return { ...moto, totalInStock, discountData };
  }

  //Получение данных о конкретном мотоцикле по его id:
  async getMotorcycleById(id: string) {
    return await prisma.motorcycle.findUnique({
      where: { id },
      include: {
        brand: true,
        siteCategory: true,
        images: true, //Галерея изображений
        //Подтягиваем остатки со всех складов:
        stocks: {
          select: { quantity: true, reserved: true },
        },
      },
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

  //Удаление модели мотоцикла:
  async deleteMotorcycle(id: string) {
    //Сначала удаляем мотоцикл из поискового индекса Elasticsearch:
    try {
      await searchService.deleteFromIndex(id);
      logger.info(
        `[Elasticsearch] Модель ID ${id} успешно удалена из поискового индекса.`,
      );
    } catch (error) {
      logger.error(
        `[Elasticsearch] Ошибка при удалении модели ID ${id} из индекса:`,
        error,
      );
    }

    //Затем удаляем запись из реляционной базы данных PostgreSQL:
    return await prisma.motorcycle.delete({
      where: { id },
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

    const newMotorcycle = await prisma.motorcycle.create({
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

    return newMotorcycle;
  }

  //Обновление данных о модели мотоцикла:
  async updateMotorcycle(
    rawData: updateMotoAdminBodyArgs,
    files: Express.Multer.File[],
    id: string,
  ) {
    const slug = slugify(`${rawData.model}${rawData.year}`);

    //1.Удаляем старые изображения:
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
            logger.info("Файл уже удален");
          }
        }),
      );
      await prisma.productImage.deleteMany({
        where: { id: { in: rawData.deletedImageIds } },
      });
    }

    //2.Обновляем главное изображение:
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

    //3.Узнаем, сколько картинок осталось в базе для этого байка, чтобы продолжить нумерацию (например, начать с "-3", если 3 уже есть)
    const existingImagesCount = await prisma.productImage.count({
      where: { motorcycleId: id },
    });
    //Проверяем, осталась ли в базе хоть одна главная картинка:
    const hasMainImage = await prisma.productImage.count({
      where: {
        motorcycleId: id,
        isMain: true, // Ищем именно главное фото
      },
    });
    // Если главных картинок не осталось, то первая новая картинка станет главной:
    const shouldAssignNewMain = hasMainImage === 0;
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
          logger.info("Ошибка перемещения");
        }
        // Картинка станет главной (isMain: true), если старую обложку удалили И это самый первый файл в текущем цикле (index === 0)
        const isMain = shouldAssignNewMain && index === 0;
        return { url: newFileName, isMain };
      }),
    );

    //4.Извлекаем из объекта данных все лишние поля (также отключаем оповещения ESLint, что переменные далее не используются):
    const {
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
      ...finalData
    } = rawData;

    //Превращаем "siteCategory" в "siteCategoryId":
    const siteCategoryId = await prisma.siteCategory.findUnique({
      where: { name: siteCategory },
      select: { id: true },
    });

    //5.Производим обновление данных:
    const updatedMotorcycle = await prisma.motorcycle.update({
      where: { id },
      data: {
        ...finalData,
        // slug,
        siteCategoryId: siteCategoryId!.id,
        images: { create: newImages },
      },
      include: { images: true },
    });

    //6.Синхронизируем Elasticsearch:
    try {
      // Вызываем точечную переиндексацию (метод esClient.update, который мы исправили ранее)
      await searchService.indexMotorcycle(updatedMotorcycle.id);
      logger.info(
        `[Elasticsearch] Данные мотоцикла ID ${updatedMotorcycle.id} успешно обновлены в индексе.`,
      );
    } catch (error) {
      // Логируем ошибку, но не прерываем выполнение метода, чтобы изменения в Postgres сохранились
      logger.error(
        `[Elasticsearch] Не удалось обновить поисковый индекс для мотоцикла ID ${updatedMotorcycle.id}:`,
        error,
      );
    }

    // Заменяем исходный return на возврат уже сохраненной переменной:
    return updatedMotorcycle;
  }

  //Получение списка брендов:
  async getBrands({ page, limit, search }: GetBrandsArgs) {
    const skip = (page - 1) * limit;

    //Создаем объект фильтрации:
    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const [items, total] = await Promise.all([
      prisma.brand.findMany({
        where, //Применяем поиск по имени
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          country: true,
          slug: true,
          image: true,
          _count: {
            select: { motorcycles: true }, //motorcyclesCount (общее кол-во мотоциклов конкретного бренда)
          },
        },
        orderBy: { name: "asc" }, //Сортируем по алфавиту
      }),
      prisma.brand.count({ where }), //Считаем количество только найденных брендов
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Получить все бренды на странице админки:
  async getBrandsAdmin(search: string, skip: number, limit: number) {
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

    //Удаляем бренд из PostgreSQL (удалятся все связанные модели):
    await prisma.brand.delete({ where: { id } });

    // 3)Удаляем все мотоциклы бренда из Elasticsearch:
    if (affectedMotos.length > 0) {
      try {
        const motoIds = affectedMotos.map((m) => m.id);
        await searchService.deleteFromIndexBulk(motoIds);
        logger.info(
          `[Elasticsearch] Из индекса успешно удалено ${affectedMotos.length} моделей бренда ID: ${id}`,
        );
      } catch (error) {
        logger.error(
          `[Elasticsearch] Ошибка при пакетном удалении моделей бренда ID ${id}:`,
          error,
        );
      }
    }

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

    //Если slug или название бренда изменились, то обновляем данные о бренде во всех его мотоциклах в Elasticsearch:
    if (oldBrand && (oldBrand.slug !== slug || oldBrand.name !== name)) {
      try {
        // Вызываем наш bulk-метод, который за 1 запрос обновит весь бренд в Elastic:
        await searchService.syncBrandMotorcycles(id);
      } catch (error) {
        logger.error(
          `[Elasticsearch] Ошибка при синхронизации мотоциклов после обновления бренда ID ${id}:`,
          error,
        );
      }
    }

    return { oldBrand, updatedBrand };
  }
}

export const catalogService = new CatalogService();
