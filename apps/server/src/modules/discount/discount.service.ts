import { redis } from "src/lib/redis.js";
import { prisma } from "@repo/database";
import { faker } from "@faker-js/faker";
import { MailService } from "src/shared/mail.service.js";

export class DiscountService {
  //Глобальная скидка (по году выпуска):
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
  }

  //Промокоды (генерируем 5 рандомных слов через Faker):
  async generateWeeklyPromos() {
    //Деактивируем старые промокоды:
    await prisma.promoCode.updateMany({ data: { isActive: false } });

    for (let i = 0; i < 5; i++) {
      const code = faker.word.adjective().toUpperCase();
      const amount = Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000;

      await prisma.promoCode.create({
        data: {
          code,
          discountAmount: amount,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  //Персональная скидка:
  async generatePersonalDiscounts() {
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
        expiresAt.setDate(expiresAt.getDate() + 7); // Скидка на неделю

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

        await MailService.sendLuckyBikeMail(
          user.email,
          `${randomBike.brand.name} ${randomBike.model}`,
          oldPrice,
          newPrice,
        );
      }
    }
    console.log(
      `Персональные скидки для ${users.length} пользователей сгенерированы.`,
    );
  }
}

export const discountService = new DiscountService();
