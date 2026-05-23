//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Библиотека для генерации рандомных слов:
import { faker } from "@faker-js/faker";
//Для создания событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";

export class DiscountService {
  //Генерация глобальной скидки (по году выпуска):
  async generateGlobalDiscount() {
    const randomYear = Math.floor(Math.random() * (2021 - 1894 + 1)) + 1894; //Выбираем рандомный год для мотоциклов (1894-2021)
    const percent = Math.floor(Math.random() * (15 - 5 + 1)) + 5; //Выбираем рандомный размрер скидки (5-15%)

    //Сохраняем в Redis на 24 часа:
    await redis.set(
      "global_sale",
      JSON.stringify({ year: randomYear, percent }),
      "EX",
      86400,
    );
    console.log(`🔥 Глобальная скидка: ${randomYear} год, -${percent}%`);

    return {
      globalYear: randomYear,
      globalPercent: percent,
    };
  }

  //Генерация промокодов (генерируем 5 рандомных слов через Faker):
  async generateWeeklyPromos() {
    //Деактивируем старые промокоды:
    await prisma.promoCode.updateMany({ data: { isActive: false } });

    const promos = [];
    const promoDataToInsert = [];

    //Генерируем данные в оперативной памяти (без запросов к БД):
    for (let i = 0; i < 5; i++) {
      const code = faker.word.adjective().toUpperCase();
      promos.push(code);

      const amount = Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000;

      promoDataToInsert.push({
        code,
        discountAmount: amount,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    //Вставляем все промокоды одним запросом в БД:
    if (promoDataToInsert.length > 0) {
      await prisma.promoCode.createMany({
        data: promoDataToInsert,
      });
    }

    return promos;
  }

  //Генерация персональных скидкок:
  async generatePersonalDiscounts() {
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

    if (users.length === 0) return { personalCount: 0 };

    //Получаем данные всех мотоциклов:
    const allBikes = await prisma.motorcycle.findMany({
      select: {
        id: true,
        model: true,
        price: true,
        slug: true,
        brand: {
          select: { name: true },
        },
      },
    });

    if (allBikes.length === 0) return { personalCount: 0 };

    const bikesCount = allBikes.length;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // Скидка на 3 дня

    //Удаляем существующие скидки для пользователей:
    const userIds = users.map((u) => u.id);
    await prisma.personalDiscount.deleteMany({
      where: { userId: { in: userIds } },
    });

    const discountsToInsert = [];
    const emailEvents = [];

    for (const user of users) {
      // Выбираем случайный байк из массива в памяти:
      const randomIndex = Math.floor(Math.random() * bikesCount);
      const randomBike = allBikes[randomIndex];

      //Формируем данные для пакетной вставки:
      discountsToInsert.push({
        userId: user.id,
        motorcycleId: randomBike.id,
        discountPercent: 20,
        expiresAt,
      });

      //Собираем данные для отправки писем:
      const oldPrice = randomBike.price;
      const newPrice = Math.round(oldPrice * 0.8);

      emailEvents.push({
        email: user.email,
        model: randomBike.model,
        brandName: randomBike.brand.name,
        slug: randomBike.slug,
        oldPrice,
        newPrice,
      });
    }

    //Вставляем все скидки:
    if (discountsToInsert.length > 0) {
      await prisma.personalDiscount.createMany({
        data: discountsToInsert,
      });
    }

    //Отправляем события в EventBus:
    for (const ev of emailEvents) {
      eventBus.emit(
        EVENTS.DISCOUNTS_GENERATED,
        ev.email,
        ev.model,
        ev.brandName,
        ev.slug,
        ev.oldPrice,
        ev.newPrice,
      );
    }

    console.log(
      `Персональные скидки для ${users.length} пользователей сгенерированы пакетно.`,
    );
    return { personalCount: users.length };
  }

  //Применение промокода:
  async applyPromoCode(code: string, userId: string) {
    //Параллельно ищем промокод и email пользователя:
    const [promo, user] = await Promise.all([
      prisma.promoCode.findUnique({
        where: { code: code.toUpperCase(), isActive: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }, // Берем только email, чтобы не грузить лишние данные
      }),
    ]);

    if (!user) {
      throw new AppError(404, "Пользователь не найден");
    }

    if (!promo || promo.expiresAt < new Date()) {
      throw new AppError(400, "Промокод не найден или истек");
    }

    //Если промокод уже использован юзером - отказ
    const alreadyUsed = await prisma.usedPromo.findUnique({
      where: {
        //Составной ключ используем:
        customerEmail_promoCodeId: {
          customerEmail: user.email,
          promoCodeId: promo.id,
        },
      },
    });

    if (alreadyUsed) {
      throw new AppError(400, "Вы уже использовали этот промокод");
    }

    return {
      promoCode: promo.code,
      promoDiscountAmount: promo.discountAmount,
    };
  }

  //Получение текущей глобальной скидки:
  async getGlobalDiscount() {
    const raw = await redis.get("global_sale");
    return raw ? JSON.parse(raw) : null;
  }

  //Получить все действующие промокоды:
  async getAllActivePromos() {
    return await prisma.promoCode.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() }, //Только действующие
      },
      orderBy: { createdAt: "desc" },
    });
  }
  //В будущем можно будет добавить индекс на поле isActive в схему Prisma, если промокодов станет много

  //Получить все промокоды:
  async getPromoCodes() {
    return await prisma.promoCode.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  //Получить персональные скидки:
  async getPersonalDiscounts(email: string) {
    return await prisma.personalDiscount.findMany({
      where: email
        ? {
            user: {
              is: {
                email: { contains: String(email), mode: "insensitive" },
              },
            },
          }
        : {},
      include: {
        user: { select: { email: true } },
        motorcycle: { select: { model: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const discountService = new DiscountService();
