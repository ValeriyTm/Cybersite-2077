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
}

export const searchService = new SearchService();
