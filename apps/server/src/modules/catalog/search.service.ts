import { Client } from "@elastic/elasticsearch";
import { prisma } from "@repo/database";

//Подключаемся к контейнеру:
const esClient = new Client({ node: "http://localhost:9200" });

export class SearchService {
  private readonly indexName = "motorcycles";

  //Метод для синхронизации всех данных из PostgreSQL в Elasticsearch:
  async syncAllMotorcycles() {
    console.log("Начинаем синхронизацию с Elasticsearch...");

    //Выкачиваем все необходимые строки из БД через Prisma:
    const motorcycles = await prisma.motorcycle.findMany({
      include: {
        brand: true,
        siteCategory: true,
        images: true,
      },
    });

    //Формируем массив для bulk-загрузки:
    const operations = motorcycles.flatMap((doc) => [
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
      },
    ]);

    //Отправляем всё в Elasticsearch:
    const bulkResponse = await esClient.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
      console.error("❌ Ошибки при индексации:", bulkResponse.items);
    } else {
      console.log(`✅ Успешно проиндексировано ${motorcycles.length} моделей!`);
    }
  }

  //Основной поиск по моделям с фильтрами:
  async searchMotorcycles(filters: any) {
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
    } = filters;

    const query: any = {
      bool: {
        must: [], // Обязательные условия
        filter: [], // Условия фильтрации (не влияют на релевантность, работают быстро)
      },
    };

    // 🎯 2. Добавляем логику поиска по названию модели
    if (search) {
      query.bool.must.push({
        match: {
          model: {
            query: search,
            fuzziness: "AUTO", // Прощает опечатки (напр. "Yamha" вместо "Yamaha")
            operator: "and", // Ищет все слова из запроса
          },
        },
      });
    }

    // 1. Фильтр по бренду (обязательно для страницы бренда)
    if (brandSlug) {
      query.bool.filter.push({ match: { brandSlug: brandSlug } });
    }

    // 2. Диапазон цен
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

    // 3. Год выпуска
    if (minYear || maxYear) {
      query.bool.filter.push({
        range: {
          year: {
            gte: minYear || 1900,
            lte: maxYear || 2100, // 🎯 Теперь "До" работает
          },
        },
      });
    }

    // 4. Категория (Allround, Sport и т.д.)
    if (category) {
      // Убираем term и .keyword, используем match 🎯
      query.bool.filter.push({ match: { category: category } });
    }

    // 5. Объем двигателя (от...)
    if (minDisplacement || maxDisplacement) {
      query.bool.filter.push({
        range: {
          displacement: {
            gte: minDisplacement || 0,
            lte: maxDisplacement || 99999, // 🎯 Теперь "До" работает
          },
        },
      });
    }

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

    if (transmission) {
      // Убираем term и .keyword, используем match 🎯
      query.bool.filter.push({ match: { transmission: transmission } });
    }

    // Сортировка
    let sort: any = [{ _score: "desc" }]; // По умолчанию по релевантности
    //Алфавитный порядок (А-Я):
    if (sortBy === "name_asc") {
      sort = [{ "model.keyword": "asc" }]; // Используем .keyword для строк
    }

    //Алфавитный порядок (Я-А):
    if (sortBy === "name_desc") {
      sort = [{ "model.keyword": "desc" }]; // Теперь Z-A заработает
    }

    //Цена:
    if (sortBy === "price_asc") sort = [{ price: "asc" }];
    if (sortBy === "price_desc") sort = [{ price: "desc" }];

    //Год выпуска:
    if (sortBy === "year_desc") sort = [{ year: "desc" }];

    //Рейтинг (от высокого к низкому):
    if (sortBy === "rating_desc") {
      sort = [{ rating: "desc" }]; // Убедись, что поле в Elastic называется rating
    }

    const result = await esClient.search({
      index: this.indexName,
      from: (page - 1) * limit, //Расчёт зависит от переданного лимита
      size: limit, //Мой лимит (обычно 20)
      query,
      sort,
    });

    // Считаем общее количество документов
    const totalItems =
      typeof result.hits.total === "number"
        ? result.hits.total
        : (result.hits.total as any)?.value || 0;

    return {
      // Превращаем формат Elastic обратно в массив объектов
      items: result.hits.hits.map((hit: any) => ({
        ...(hit._source as any), // Распаковываем данные документа
        id: hit._id, //Явно добавляем id из метаданных Elastic
      })),
      total:
        typeof result.hits.total === "number"
          ? result.hits.total
          : (result.hits.total as any)?.value || 0,
      page: Number(page),
      pages: Math.ceil(totalItems / limit) || 1,
    };
  }

  //Поиск аналогичных мотоциклов (рекомендации):
  async getRelatedMotorcycles(motorcycle: any, limit = 4) {
    //[Отбор происходит по принципу «похожий класс + похожий объём».Мы ищем мотоциклы только из той же категории. Elastic старается в первую очередь подсунуть модели того же производителя. Мы ищем модели с объёмом +/- 30% от текущего.]
    // 1. Собираем только те фильтры, которые реально существуют в объекте 🛡️
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
        // ВАЖНО: Добавляем should только если в нем есть элементы 🎯
        ...(should.length > 0 && { should }),
        must_not: [
          { term: { _id: motorcycle.id } }, // Исключаем текущую модель из рекомендаций
        ],
        // Минимум одно совпадение из should не обязательно (т.к. есть must),
        // но если хотим, чтобы should влиял на порядок - оставляем так.
      },
    };

    // 🎯 ЛОГ ДЛЯ ОТЛАДКИ (Посмотри его в консоли сервера при ошибке!)
    // console.log('DEBUG RELATED QUERY:', JSON.stringify(query, null, 2));

    const result = await esClient.search({
      index: this.indexName,
      size: limit,
      query,
    });

    return result.hits.hits.map((hit: any) => ({
      ...(hit._source as object),
      id: hit._id,
    }));
  }

  //Поиск с выводом предположений:
  async suggestMotorcycles(query: string) {
    const result = await esClient.search({
      index: this.indexName,
      size: 7, //Показываем только 7 лучших совпадений
      query: {
        match_phrase_prefix: {
          //Ищет по первым буквам слов
          model: {
            query: query,
          },
        },
      },
      // Возвращаем только нужные поля для подсказки
      _source: ["id", "model", "slug", "brandSlug", "mainImage", "year"],
    });

    return result.hits.hits.map((hit) => ({
      ...(hit._source as object),
      id: hit._id,
    }));
  }
}

export const searchService = new SearchService();
