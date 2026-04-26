//----------------------Скрипт для запуска генерации промокодов и скидок----------------//
import { prisma } from "@repo/database"; // Клиент призмы
import { redis } from "../shared/lib/redis.js"; //Клиент Redis
import { faker } from "@faker-js/faker"; //Генерация рандомных слов

async function generatePromos() {
  try {
    //1.Глобальные скидки:
    console.log("Начинаем генерацию глобальных скидок...");
    const randomYear = Math.floor(Math.random() * (2021 - 1894 + 1)) + 1894; //Выбираем рандомный год для мотоциклов (1894-2021)
    const percent = Math.floor(Math.random() * (15 - 5 + 1)) + 5; //Выбираем рандомный размрер скидки (5-15%)

    //Сохраняем в Redis на 24 часа:
    await redis.set(
      "global_sale",
      JSON.stringify({ year: randomYear, percent }),
      "EX",
      86400,
    );
    console.log(
      `Сгенерирована глобальная скидка: ${randomYear} год, -${percent}%`,
    );

    //2.Персональные скидки:
    console.log("Начинаем генерацию персональных скидок...");
    //Чистим просроченные скидки в БД перед началом:
    await prisma.personalDiscount.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    //Находим всех пользователей, подтвердивших email:
    const users = await prisma.user.findMany({
      where: { isActivated: true },
      select: { id: true, email: true, name: true },
    });

    //Получаем общее количество мотоциклов для эффективного рандома:
    const bikesCount = await prisma.motorcycle.count();

    for (const user of users) {
      //Выбираем случайный пропуск (skip), чтобы получить рандомный байк:
      const skip = Math.floor(Math.random() * bikesCount);
      const randomBike = await prisma.motorcycle.findFirst({
        skip: skip,
        include: { brand: true },
      });

      if (randomBike) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3); //Скидка на 3 дня

        //Записываем скидку в БД (обновляем старую или создаем новую):
        //@ts-ignore:
        await prisma.personalDiscount.upsert({
          where: {
            userId_motorcycleId: {
              userId: user.id,
              motorcycleId: randomBike.id,
            },
          },
          update: { expiresAt, discountPercent: 20 },
          create: {
            userId: user.id,
            motorcycleId: randomBike.id,
            discountPercent: 20,
            expiresAt,
          },
        });
      }
    }
    console.log(
      `Персональные скидки для ${users.length} пользователей сгенерированы.`,
    );

    //3.Промокоды:
    console.log("Начинаем генерацию промокодов...");
    //Деактивируем старые промокоды:
    await prisma.promoCode.updateMany({ data: { isActive: false } });

    const promos = [];
    for (let i = 0; i < 5; i++) {
      const code = faker.word.adjective().toUpperCase();
      promos.push(code);
      const amount = Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000;

      await prisma.promoCode.upsert({
        where: { code: code }, // Ищем по уникальному полю code
        update: {
          discountAmount: amount,
          isActive: true, // Активируем заново, если он уже был в базе
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        create: {
          code,
          discountAmount: amount,
          isActive: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log("Промокоды сгенерированы");

    process.exit(0); //Принудительно завершаем процесс успешно
  } catch (error) {
    console.error("Критическая ошибка синхронизации Elastic:", error);
    process.exit(1);
  }
}

generatePromos();
