//----------------------Скрипт для запуска генерации промокодов и скидок----------------//
import { prisma } from "@repo/database"; // Клиент призмы
import { redis } from "../shared/lib/redis.js"; //Клиент Redis
import { faker } from "@faker-js/faker"; //Генерация рандомных слов
import { logger } from "src/shared/lib/logger.js"; //Логирование

async function generatePromos() {
  try {
    //1.Глобальные скидки:
    logger.info("Начинаем генерацию глобальных скидок...");
    const randomYear = Math.floor(Math.random() * (2021 - 1894 + 1)) + 1894; //Выбираем рандомный год для мотоциклов (1894-2021)
    const percent = Math.floor(Math.random() * (15 - 5 + 1)) + 5; //Выбираем рандомный размрер скидки (5-15%)

    //Сохраняем в Redis на 24 часа:
    await redis.set(
      "global_sale",
      JSON.stringify({ year: randomYear, percent }),
      "EX",
      86400,
    );
    logger.info(
      `Сгенерирована глобальная скидка: ${randomYear} год, -${percent}%`,
    );

    //2.Персональные скидки:
    logger.info("Начинаем генерацию персональных скидок...");
    const now = new Date();
    //Чистим просроченные скидки в БД перед началом:
    await prisma.personalDiscount.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    //Находим всех пользователей, подтвердивших email:
    const users = await prisma.user.findMany({
      where: { isActivated: true },
      select: { id: true, email: true, name: true },
    });

    if (users.length > 0) {
      //Получаем ID всех мотоциклов:
      const allBikes = await prisma.motorcycle.findMany({
        select: { id: true },
      });

      if (allBikes.length > 0) {
        const bikesCount = allBikes.length;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3); // Скидка на 3 дня

        // тобы избежать медленных upsert в цикле, удаляем старые скидки этих пользователей
        const userIds = users.map((u) => u.id);
        await prisma.personalDiscount.deleteMany({
          where: { userId: { in: userIds } },
        });

        const discountsToInsert = [];

        //Синхронный цикл в памяти Node.js:
        for (const user of users) {
          const randomIndex = Math.floor(Math.random() * bikesCount);
          const randomBike = allBikes[randomIndex];

          discountsToInsert.push({
            userId: user.id,
            motorcycleId: randomBike.id,
            discountPercent: 20,
            expiresAt,
          });
        }

        //Вставляем все скидки в БД:
        await prisma.personalDiscount.createMany({
          data: discountsToInsert,
        });
      }
    }

    logger.info(
      `Персональные скидки для ${users.length} пользователей сгенерированы.`,
    );

    //3.Промокоды:
    logger.info("Начинаем генерацию промокодов...");
    //Деактивируем старые промокоды:
    await prisma.promoCode.updateMany({ data: { isActive: false } });

    const promoDataToInsert = [];
    const expiresAtPromo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 5; i++) {
      const code = faker.word.adjective().toUpperCase();
      const amount = Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000;

      promoDataToInsert.push({
        code,
        discountAmount: amount,
        isActive: true,
        expiresAt: expiresAtPromo,
      });
    }

    // Вставляем все 5 промокодов одним быстрым INSERT
    await prisma.promoCode.createMany({
      data: promoDataToInsert,
      skipDuplicates: true, // Игнорируем, если такой код случайно сгенерировался ранее
    });

    logger.info("Промокоды сгенерированы");

    process.exit(0); //Принудительно завершаем процесс успешно
  } catch (error) {
    logger.error("Критическая ошибка при генерации промокодов/скидок:", error);
    process.exit(1);
  }
}

generatePromos();
