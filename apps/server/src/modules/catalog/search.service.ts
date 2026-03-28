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
        year: doc.year,
        price: doc.price,
        displacement: doc.displacement,
        power: doc.power,
        transmission: doc.transmission,
        rating: doc.rating,
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
      year,
      category,
      minDisplacement,
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
      query.bool.filter.push({ term: { brandSlug: brandSlug } });
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
    if (year) {
      query.bool.filter.push({ term: { year: year } });
    }

    // 4. Категория (Allround, Sport и т.д.)
    if (category) {
      query.bool.filter.push({ term: { category: category } });
    }

    // 5. Объем двигателя (от...)
    if (minDisplacement) {
      query.bool.filter.push({
        range: { displacement: { gte: minDisplacement } },
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
      items: result.hits.hits.map((hit) => hit._source),
      total:
        typeof result.hits.total === "number"
          ? result.hits.total
          : result.hits.total?.value,
    };
  }
}

export const searchService = new SearchService();
