import { Client } from "@elastic/elasticsearch";
import { prisma } from "@repo/database";
import { DiscountLogic } from "../discount/discount.logic.js";

//Подключаемся к контейнеру:
export const esClient = new Client({ node: "http://localhost:9200" });

export class SearchService {
  private readonly indexName = "motorcycles";

  //Метод для синхронизации всех данных из PostgreSQL в Elasticsearch:
  async syncAllMotorcycles() {
    console.log("Начинаем синхронизацию с Elasticsearch...");

    //Выкачиваем все необходимые строки из PostgreSQL:
    const motorcycles = await prisma.motorcycle.findMany({
      include: {
        brand: true,
        siteCategory: true,
        images: true,
        stocks: {
          select: { quantity: true, reserved: true },
        },
      },
    });

    //Формируем массив для bulk-загрузки большого кол-ва данных:
    const operations = motorcycles.flatMap((doc) => {
      //Считаем доступный остаток (общее кол-во - зарезервированное):
      const totalInStock = doc.stocks.reduce(
        (acc, s) => acc + (s.quantity - s.reserved),
        0,
      );

      return [
        { index: { _index: this.indexName, _id: doc.id } },
        {
          model: doc.model,
          slug: doc.slug,
          brand: doc.brand.name,
          brandSlug: doc.brand.slug,
          category: doc.category,
          year: Number(doc.year) || 0,
          price: Number(doc.price) || 0,
          displacement: Number(doc.displacement) || 0,
          createdAt: doc.createdAt,
          power: Number(doc.power) || 0,
          transmission: doc.transmission,
          rating: Number(doc.rating) || 0,
          mainImage: doc.images?.[0]?.url || "",
          totalInStock: Math.max(0, totalInStock),
        },
      ];
    });

    //Отправляем всё в Elasticsearch:
    const bulkResponse = await esClient.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
      console.error("Ошибки при индексации:", bulkResponse.items);
    } else {
      console.log(`Успешно проиндексировано ${motorcycles.length} моделей`);
    }
  }

  //Основной поиск по моделям с фильтрами:
  async searchMotorcycles(filters: any, userId: string) {
    const {
      brandSlug,
      search,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      category,
      transmission,
      minDisplacement,
      maxDisplacement,
      minPower,
      maxPower,
      page = 1,
      limit = 20,
      sortBy,
      onlyInStock,
    } = filters;

    const query: any = {
      bool: {
        must: [], //Обязательные условия
        filter: [], //Условия фильтрации
      },
    };

    //Добавляем логику поиска по названию модели:
    if (search) {
      query.bool.must.push({
        match: {
          model: {
            query: search,
            fuzziness: "AUTO", //Прощает опечатки ("Yamha" вместо "Yamaha")
            operator: "and", //Ищет все слова из запроса
          },
        },
      });
    }

    //Фильтр по бренду:
    if (brandSlug && brandSlug !== "all") {
      query.bool.filter.push({ match: { brandSlug: brandSlug } });
    }

    //Диапазон цен:
    if (minPrice || maxPrice) {
      query.bool.filter.push({
        range: {
          price: {
            gte: minPrice || 0,
            lte: maxPrice || 99999999,
          },
        },
      });
    }

    //Год выпуска:
    if (minYear || maxYear) {
      query.bool.filter.push({
        range: {
          year: {
            gte: minYear || 1900,
            lte: maxYear || 2100,
          },
        },
      });
    }

    //Только в наличии:
    const isOnlyInStock = String(onlyInStock) === "true";
    if (isOnlyInStock) {
      query.bool.filter.push({
        range: {
          totalInStock: { gt: 0 },
        },
      });
    }

    //Категория:
    if (category) {
      query.bool.filter.push({ match: { category: category } });
    }

    //Объем двигателя:
    if (minDisplacement || maxDisplacement) {
      query.bool.filter.push({
        range: {
          displacement: {
            gte: minDisplacement || 0,
            lte: maxDisplacement || 99999,
          },
        },
      });
    }

    //Мощность двигателя:
    if (minPower || maxPower) {
      query.bool.filter.push({
        range: {
          power: {
            // Убедись, что поле в Elastic называется power
            gte: Number(minPower) || 0,
            lte: Number(maxPower) || 9999,
          },
        },
      });
    }

    //Трансмиссия:
    if (transmission) {
      query.bool.filter.push({ match: { transmission: transmission } });
    }

    //Сортировка:
    let sort: any = [{ _score: "desc" }]; //По умолчанию - по релевантности
    //Алфавитный порядок (А-Я):
    if (sortBy === "name_asc") {
      sort = [{ "model.keyword": "asc" }];
    }
    //Алфавитный порядок (Я-А):
    if (sortBy === "name_desc") {
      sort = [{ "model.keyword": "desc" }];
    }

    //Цена:
    if (sortBy === "price_asc") sort = [{ price: "asc" }];
    if (sortBy === "price_desc") sort = [{ price: "desc" }];

    //Год выпуска:
    if (sortBy === "year_desc") sort = [{ year: "desc" }];

    //Рейтинг (от высокого к низкому):
    if (sortBy === "rating_desc") {
      sort = [{ rating: "desc" }];
    }

    console.log("Debag elastic query:", JSON.stringify(query, null, 2));

    const result = await esClient.search({
      index: this.indexName,
      from: (page - 1) * limit, //Расчёт зависит от переданного лимита (20 или 40 передаём)
      size: limit,
      query,
      sort,
    });

    //Превращаем хиты Elastic в обычные объекты:
    const rawItems = result.hits.hits.map((hit: any) => ({
      ...(hit._source as any), //Распаковываем данные документа
      id: hit._id, //Явно добавляем id из метаданных Elastic
    }));

    //Прогоняем каждый товар через логику скидок; передаем userId, чтобы подтянулись персональные скидки:
    const itemsWithDiscounts = await Promise.all(
      rawItems.map(async (moto: any) => {
        const discountData = await DiscountLogic.calculateFinalPrice(
          moto,
          userId,
        );
        return {
          ...moto,
          discountData, // Здесь будет { finalPrice, originalPrice, isPersonal, etc. }
        };
      }),
    );

    //Считаем общее количество:
    const totalItems =
      typeof result.hits.total === "number"
        ? result.hits.total
        : (result.hits.total as any)?.value || 0;

    return {
      items: itemsWithDiscounts, //Возвращаем обогащенные скидками данные
      total: totalItems,
      page: Number(page),
      pages: Math.ceil(totalItems / limit) || 1,
    };
  }

  //Поиск аналогичных мотоциклов (рекомендации):
  async getRelatedMotorcycles(motorcycle: any, userId?: string, limit = 4) {
    //[Отбор происходит по принципу «похожий класс + похожий объём».Мы ищем мотоциклы только из той же категории. Elastic старается в первую очередь выдать модели того же производителя. Мы ищем модели с объёмом +/- 30% от текущего.]
    //Собираем только те фильтры, которые реально существуют в объекте:
    const must: any[] = [];
    const should: any[] = [];

    if (motorcycle.category) {
      must.push({ term: { "category.keyword": motorcycle.category } });
    }

    if (motorcycle.brandSlug) {
      should.push({ term: { "brandSlug.keyword": motorcycle.brandSlug } });
    }

    if (motorcycle.displacement && motorcycle.displacement > 0) {
      should.push({
        range: {
          displacement: {
            gte: Math.floor(motorcycle.displacement * 0.7),
            lte: Math.ceil(motorcycle.displacement * 1.3),
          },
        },
      });
    }

    const query = {
      bool: {
        must,
        //Добавляем should только если в нем есть элементы:
        ...(should.length > 0 && { should }),
        must_not: [
          { term: { _id: motorcycle.id } }, //Исключаем текущую модель из рекомендаций
        ],
      },
    };

    const result = await esClient.search({
      index: this.indexName,
      size: limit,
      query,
    });

    //Превращаем хиты Elastic в объекты:
    const rawItems = result.hits.hits.map((hit: any) => ({
      ...(hit._source as any),
      id: hit._id,
    }));

    return await Promise.all(
      rawItems.map(async (moto: any) => {
        const discountData = await DiscountLogic.calculateFinalPrice(
          moto,
          userId,
        );
        return { ...moto, discountData };
      }),
    );
  }

  //Поиск с выводом предположений:
  async suggestMotorcycles(query: string) {
    const result = await esClient.search({
      index: this.indexName,
      size: 7, //Показываем только 7 лучших совпадений
      query: {
        match_phrase_prefix: {
          //Ищет по первым буквам слов:
          model: {
            query: query,
          },
        },
      },
      //Возвращаем только нужные поля для вывода предположений:
      _source: ["id", "model", "slug", "brandSlug", "mainImage", "year"],
    });

    return result.hits.hits.map((hit) => ({
      ...(hit._source as object),
      id: hit._id,
    }));
  }

  //Поиск мотоциклов на странице админки:
  async searchMotorcyclesAdmin(query: string, page: number, limit: number) {
    const result = await esClient.search({
      index: this.indexName,
      from: (page - 1) * limit, //Пропуск записей для пагинации
      size: limit, //Показываем только 7 лучших совпадений
      query: {
        match_phrase_prefix: {
          //Ищет по первым буквам слов:
          model: {
            query: query,
          },
        },
      },
      //Возвращаем только нужные поля для вывода предположений:
      _source: ["id"],
    });

    return {
      ids: result.hits.hits.map((hit) => hit._id),
      total:
        typeof result.hits.total === "number"
          ? result.hits.total
          : result.hits.total?.value || 0, //Получаем общее кол-во совпадений
    };
  }

  //Обновляем данные в Elasticsearch при изменении остатков:
  async updateStockInElastic(motorcycleId: string) {
    //Считаем актуальный остаток из БД:
    const stocks = await prisma.stock.findMany({
      where: { motorcycleId },
      select: { quantity: true, reserved: true },
    });

    const totalInStock = stocks.reduce(
      (acc, s) => acc + (s.quantity - s.reserved),
      0,
    );

    //Частично обновляем документ в ElasticSearch:
    await esClient.update({
      index: this.indexName,
      id: motorcycleId,
      doc: {
        totalInStock: Math.max(0, totalInStock),
      },
    });
  }

  //Обновляем данные по рейтингу:
  async updateRatingInElastic(id: string, rating: number) {
    await esClient.update({
      index: "motorcycles",
      id,
      doc: { rating },
    });
  }

  //Обновляем инфу о мотоцикле после внесения изменений в админке:
  async indexMotorcycle(id: string) {
    // Подтягиваем свежие данные из БД со всеми связями для индекса
    const moto = await prisma.motorcycle.findUnique({
      where: { id },
      include: { brand: true, images: true },
    });

    if (!moto) return;

    await esClient.index({
      index: this.indexName,
      id: moto.id,
      document: {
        model: moto.model,
        slug: moto.slug,
        brandSlug: moto.brand.slug,
        year: moto.year,
        mainImage: moto.images.find((img) => img.isMain)?.url || null,
        price: moto.price,
      },
    });
  }

  //Удаляем мотоцикл из Elasticsearch после удаления записи в админке:
  async deleteFromIndex(id: string) {
    await esClient
      .delete({
        index: this.indexName,
        id: id,
      })
      .catch(() => {}); // Игнорируем, если в индексе уже нет
  }

  //Синхронизируем изменения в брендах (админка)
  async syncBrandMotorcycles(brandId: string) {
    // Находим все мотоциклы, принадлежащие этому бренду
    const motorcycles = await prisma.motorcycle.findMany({
      where: { brandId },
      select: { id: true },
    });

    // Переиндексируем каждый мотоцикл (информация о бренде подтянется автоматически внутри indexMotorcycle)
    const syncPromises = motorcycles.map((moto) =>
      this.indexMotorcycle(moto.id),
    );
    await Promise.all(syncPromises);
  }
}

export const searchService = new SearchService();
