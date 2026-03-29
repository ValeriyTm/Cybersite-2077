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
        mainImage:
          doc.images?.[0]?.url || "/public/defaults/default-card-icon.jpg",
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

  //Основной поискс фильтрами:
  async searchMotorcycles(filters: any) {
    const {
      brandSlug,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      category,
      minDisplacement,
      maxDisplacement,
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
      query.bool.filter.push({ term: { category: category } });
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

    // Сортировка
    let sort: any = [{ _score: "desc" }]; // По умолчанию по релевантности
    if (sortBy === "price_asc") sort = [{ price: "asc" }];
    if (sortBy === "price_desc") sort = [{ price: "desc" }];
    if (sortBy === "year_desc") sort = [{ year: "desc" }];

    const result = await esClient.search({
      index: this.indexName,
      from: (page - 1) * limit,
      size: limit,
      query,
      sort,
    });

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
    };
  }
}

export const searchService = new SearchService();
