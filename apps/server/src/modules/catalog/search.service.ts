//Клиент Elasticsearch:
import { Client } from "@elastic/elasticsearch";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Логика расчёта цены с учетом скидок (из модуля Discount):
import { discountLogic } from "../discount/index.js";
//Схемы валидации Zod:
import { MotorcyclesServiceArgs } from "@repo/validation";
//Типы:
import { type MotorcycleFullServer } from "@repo/types";

import { estypes } from "@elastic/elasticsearch";

//Подключаемся к контейнеру:
export const esClient = new Client({ node: process.env.ELASTIC_NODE });

interface ElasticQuery {
  bool: {
    must: Record<string, any>[];
    filter: Record<string, any>[];
  };
}

interface MotorcycleDocument {
  model: string;
  slug: string;
  brand: string;
  brandSlug: string;
  category: string;
  year: number;
  price: number;
  displacement: number;
  createdAt: string;
  power: number;
  transmission: string;
  rating: number;
  mainImage: string;
  totalInStock: number;
}
export class SearchService {
  private readonly indexName = "motorcycles";

  //Метод для синхронизации всех данных из PostgreSQL в Elasticsearch:
  async syncAllMotorcycles() {
    console.log("Начинаем порционную синхронизацию с Elasticsearch...");

    const BATCH_SIZE = 1000; // Обрабатываем по 1000 моделей за раз
    let skip = 0;
    let totalIndexed = 0;

    while (true) {
      //Выкачиваем данные порциями (пагинация по skip/take):
      const motorcycles = await prisma.motorcycle.findMany({
        include: {
          brand: true,
          siteCategory: true,
          images: true,
          stocks: {
            select: { quantity: true, reserved: true },
          },
        },
        skip: skip,
        take: BATCH_SIZE,
        orderBy: { id: "asc" }, //Сортировка обязательна для стабильной пагинации
      });

      if (motorcycles.length === 0) {
        break;
      }

      //Формируем массив для bulk-загрузки текущей порции:
      const operations = motorcycles.flatMap((doc) => {
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

      //Отправляем текущую порцию в Elasticsearch:
      const bulkResponse = await esClient.bulk({
        refresh: false, // Отключаем постоянный refresh во время массовой заливки для скорости
        operations,
      });

      if (bulkResponse.errors) {
        console.error(
          `Ошибки при индексации порции со skip ${skip}:`,
          bulkResponse.items,
        );
      }

      totalIndexed += motorcycles.length;
      console.log(`Проиндексировано порционно: ${totalIndexed} моделей...`);

      //Если вернулось меньше, чем размер батча — значит, это была последняя страница:
      if (motorcycles.length < BATCH_SIZE) {
        break;
      } else {
        skip += BATCH_SIZE; //Переходим к следующей порции
      }
    }

    //Делаем финальный refresh один раз для всего индекса, когда всё готово:
    await esClient.indices.refresh({ index: this.indexName });
    console.log(
      `Синхронизация завершена. Всего успешно проиндексировано ${totalIndexed} моделей`,
    );
  }

  //Основной поиск/сортировка по моделям с фильтрами:
  async searchMotorcycles(data: MotorcyclesServiceArgs, userId: string) {
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
    } = data;

    const query: ElasticQuery = {
      bool: {
        must: [], //Обязательные условия
        filter: [], //Условия фильтрации
      },
    };

    //------------------------Поиск:-----------------------//
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

    //---------------------Сортировка-------------:
    type SortOrder = "asc" | "desc";
    type SortSetting = Record<string, SortOrder>;

    const sortMapping = new Map<string, SortSetting[]>([
      ["name_asc", [{ "model.keyword": "asc" }]],
      ["name_desc", [{ "model.keyword": "desc" }]],
      ["price_asc", [{ price: "asc" }]],
      ["price_desc", [{ price: "desc" }]],
      ["year_desc", [{ year: "desc" }]],
      ["rating_desc", [{ rating: "desc" }]],
    ]);

    const sort: SortSetting[] = (sortBy
      ? sortMapping.get(sortBy)
      : undefined) || [{ _score: "desc" }];

    //---------------------------------------------------
    const result = await esClient.search<MotorcycleDocument>({
      index: this.indexName,
      from: (page - 1) * limit, //Расчёт зависит от переданного лимита (20 или 40 передаём)
      size: limit,
      query,
      sort,
    });

    //Для отладки:
    // console.log("result: ", JSON.stringify(result, null, 2));

    //Превращаем хиты Elastic в обычные объекты:
    const rawItems = result.hits.hits.map((hit) => ({
      ...hit._source, //Распаковываем данные документа
      id: hit._id, //Явно добавляем id из метаданных Elastic
    }));

    //Прогоняем каждый товар через логику скидок; передаем userId, чтобы подтянулись персональные скидки:
    const allDiscountData = await discountLogic.calculateFinalPricesBulk(
      rawItems,
      userId,
    ); //Получаем скидки одним пакетным запросом для всей страницы выдачи
    const itemsWithDiscounts = rawItems.map((moto, index) => ({
      ...moto,
      discountData: allDiscountData[index],
    })); //Синхронно склеиваем результаты в памяти Node.js

    //Считаем общее количество:
    const totalItems =
      typeof result.hits.total === "number"
        ? result.hits.total
        : result.hits.total?.value || 0;

    return {
      items: itemsWithDiscounts, //Возвращаем обогащенные скидками данные
      total: totalItems,
      page: Number(page),
      pages: Math.ceil(totalItems / limit) || 1,
    };
  }

  //Поиск аналогичных мотоциклов (рекомендации):
  async getRelatedMotorcycles(
    motorcycle: MotorcycleFullServer,
    userId?: string,
    limit = 4,
  ) {
    //[Отбор происходит по принципу «похожий класс + похожий объём».Мы ищем мотоциклы только из той же категории. Elastic старается в первую очередь выдать модели того же производителя. Мы ищем модели с объёмом +/- 30% от текущего.]
    //Собираем только те фильтры, которые реально существуют в объекте:
    const must: estypes.QueryDslQueryContainer[] = [];
    const should: estypes.QueryDslQueryContainer[] = [];

    if (motorcycle.category) {
      must.push({ term: { "category.keyword": motorcycle.category } });
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
        ...(should.length > 0 && { should }), //Добавляем should только если в нем есть элементы
        must_not: [
          { term: { _id: motorcycle.id } }, //Исключаем текущую модель из рекомендаций
        ],
      },
    };

    const result = await esClient.search<MotorcycleDocument>({
      index: this.indexName,
      size: limit,
      query,
    });

    //Для отладки (просмотр возвращаемых данных с Elastic):
    // console.log("result 2: ", JSON.stringify(result, null, 2));

    //Превращаем хиты Elastic в объекты:
    const rawItems = result.hits.hits.map((hit) => ({
      ...hit._source,
      id: hit._id,
    }));

    //Получаем скидки одним пакетным запросом для всех рекомендаций сразу:
    const allDiscountData = await discountLogic.calculateFinalPricesBulk(
      rawItems,
      userId,
    );

    return rawItems.map((moto, index) => ({
      ...moto,
      discountData: allDiscountData[index],
    }));
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
            query,
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
      size: limit,
      query: {
        match_phrase_prefix: {
          //Ищет по первым буквам слов:
          model: {
            query,
          },
        },
      },
      //Возвращаем только нужные поля для вывода предположений:
      _source: ["id"],
    });

    return {
      ids: result.hits.hits
        .map((hit) => hit._id)
        .filter((id): id is string => !!id), //Фильтруем, чтобы избавиться от _id, которые undefined
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

  //Обновляем данные в Elasticsearch при изменении остатков (пакетно):
  async updateStocksInElasticBulk(motorcycleIds: string[]) {
    if (!motorcycleIds || motorcycleIds.length === 0) return;

    //Забираем остатки для всех переданных мотоциклов:
    const stocks = await prisma.stock.findMany({
      where: {
        motorcycleId: { in: motorcycleIds },
      },
      select: {
        motorcycleId: true,
        quantity: true,
        reserved: true,
      },
    });

    //Группируем остатки по мотоциклам (вычисляем totalInStock для каждого) (итог будет в виде: { "id-1": 5, "id-2": 12 }):
    const stockMap: Record<string, number> = {};

    for (const s of stocks) {
      if (!stockMap[s.motorcycleId]) {
        stockMap[s.motorcycleId] = 0;
      }
      stockMap[s.motorcycleId] += s.quantity - s.reserved;
    }

    //Формируем тело для Bulk-запроса в Elasticsearch (для каждого документа Elastic требует две строки: метаданные операции и сами данные)
    const bulkOperations = motorcycleIds.flatMap((id) => {
      const totalInStock = stockMap[id] || 0;

      return [
        { update: { _index: this.indexName, _id: id } },
        { doc: { totalInStock: Math.max(0, totalInStock) } },
      ];
    });

    //Отправляем всё одним сетевым запросом:
    if (bulkOperations.length > 0) {
      await esClient.bulk({
        refresh: true, //Делает изменения видимыми для поиска сразу
        operations: bulkOperations,
      });
    }
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

    await esClient.update({
      index: this.indexName,
      id: moto.id,
      doc: {
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
        id,
      })
      .catch(() => {}); // Игнорируем, если в индексе уже нет
  }

  //Синхронизируем изменения в брендах (админка)
  async syncBrandMotorcycles(brandId: string) {
    console.log(
      `Начинаем пакетную переиндексацию мотоциклов для бренда ID: ${brandId}`,
    );

    // Находим все мотоциклы, принадлежащие этому бренду в PostgreSQL:
    const motorcycles = await prisma.motorcycle.findMany({
      where: { brandId },
      include: {
        brand: true,
        images: true,
      },
    });

    if (motorcycles.length === 0) return;

    //Формируем один Bulk-запрос для всех моделей сразу:
    const bulkOperations = motorcycles.flatMap((moto) => {
      return [
        { update: { _index: this.indexName, _id: moto.id } },
        {
          doc: {
            model: moto.model,
            slug: moto.slug,
            brandSlug: moto.brand.slug,
            year: moto.year,
            mainImage: moto.images.find((img) => img.isMain)?.url || null,
            price: moto.price,
          },
        },
      ];
    });

    //Отправляем все изменения одним пакетом:
    if (bulkOperations.length > 0) {
      await esClient.bulk({
        refresh: true, // Делаем изменения бренда сразу доступными в поиске
        operations: bulkOperations,
      });
    }

    console.log(
      `Успешно обновлен бренд для ${motorcycles.length} моделей мотоциклов.`,
    );
  }

  //Удаление связанных мотоциклов при удалении бренда:
  async deleteFromIndexBulk(motorcycleIds: string[]) {
    if (!motorcycleIds || motorcycleIds.length === 0) return;

    const bulkDeleteOperations = motorcycleIds.map((id) => ({
      delete: { _index: this.indexName, _id: id },
    }));

    await esClient.bulk({
      refresh: true,
      operations: bulkDeleteOperations,
    });
  }
}

export const searchService = new SearchService();
