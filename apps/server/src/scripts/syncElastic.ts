//----------------Скрипт для запуска синхронизации Elasticsearch и PostgreSQL------------------------//
import { prisma } from "@repo/database"; // Клиент призмы
import { esClient } from "../modules/catalog/index.js"; // Путь к ES клиенту
import { logger } from "../shared/lib/logger.js"; //Логирование

const waitForElastic = async (url: string, retries = 10) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
      logger.info(
        `[Elastic] Сервер вернул статус ${response.status}. Попытка ${i + 1}/${retries} не удалась.`,
      );
    } catch (error) {
      logger.info(
        `[Elastic] Нет связи с сервером (ошибка: ${error}). Попытка ${i + 1}/${retries} не удалась.`,
      );
    }
    if (i < retries - 1) {
      logger.info(`[Elastic] Ожидание 15 секунд перед следующей попыткой...`);
      await new Promise((res) => setTimeout(res, 15000));
    }
  }
  throw new Error("Elasticsearch не ответил вовремя.");
};

async function syncElastic() {
  await waitForElastic("http://elasticsearch:9200");

  const indexName = "motorcycles";

  try {
    logger.info("Начинаем синхронизацию с Elasticsearch...");

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

    if (motorcycles.length === 0) {
      logger.info("В базе нет мотоциклов для синхронизации.");
      return;
    }

    const operations = motorcycles.flatMap((doc) => {
      const totalInStock = doc.stocks.reduce(
        (acc, s) => acc + (s.quantity - s.reserved),
        0,
      );

      return [
        { index: { _index: indexName, _id: doc.id } },
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

    const bulkResponse = await esClient.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
      logger.error(
        "Ошибки при индексации:",
        JSON.stringify(bulkResponse.items, null, 2),
      );
      process.exit(1); // Выходим с ошибкой, чтобы цепочка CMD прервалась
    } else {
      logger.info(
        `🚀 Успешно проиндексировано ${motorcycles.length} моделей в Elastic`,
      );
      // Даем логам время дойти до консоли и выходим
      await prisma.$disconnect();
      logger.info("Скрипт синхронизации Elasticsearch завершен успешно.");
      process.exit(0); //Принудительно завершаем процесс успешно
    }
  } catch (error) {
    logger.error("Критическая ошибка синхронизации Elastic:", error);
    process.exit(1);
  }
}

syncElastic();
