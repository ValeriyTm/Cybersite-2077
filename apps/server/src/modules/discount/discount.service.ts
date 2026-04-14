//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "src/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Библиотека для генерации рандомных слов:
import { faker } from "@faker-js/faker";
//Для создания событий:
import { eventBus, EVENTS } from "src/shared/lib/eventBus.js";
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
    for (let i = 0; i < 5; i++) {
      const code = faker.word.adjective().toUpperCase();
      promos.push(code);
      const amount = Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000;

      await prisma.promoCode.create({
        data: {
          code,
          discountAmount: amount,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return promos;
  }

  //Генерация персональных скидкок:
  async generatePersonalDiscounts() {
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
        const discount = await prisma.personalDiscount.upsert({
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

        //Шлем письмо на почту о персональной скидке:
        const oldPrice = randomBike.price;
        const newPrice = Math.round(oldPrice * 0.8); // -20%

        //Генерируем событие для отправки письма:
        eventBus.emit(
          EVENTS.DISCOUNTS_GENERATED,
          user.email,
          randomBike.model,
          randomBike.brand.name,
          randomBike.slug,
          oldPrice,
          newPrice,
        );
      }
    }
    console.log(
      `Персональные скидки для ${users.length} пользователей сгенерированы.`,
    );

    return { personalCount: users.length };
  }

  //Применение промокода:
  async applyPromoCode(code: string, userId: string) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase(), isActive: true },
      include: { usedPromos: { where: { userId } } }, //Подтягиваем использование этим юзером
    });

    if (!promo || promo.expiresAt < new Date()) {
      throw new AppError(400, "Промокод не найден или истек");
    }

    //Если промокод уже использован юзером - отказ
    const alreadyUsed = await prisma.usedPromo.findFirst({
      where: { userId, promoCodeId: promo.id },
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
    const data = raw ? JSON.parse(raw) : null;
    return data;
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
}

export const discountService = new DiscountService();
