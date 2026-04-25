//-----------Логика расчёта цены с учетом скидок:-------------//
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";

export class DiscountLogic {
  //Метод вычисляет финальную цену мотоцикла для конкретного пользователя:
  async calculateFinalPrice(motorcycle: any, userId?: string) {
    let finalPrice = motorcycle.price;
    let appliedDiscount = 0; // В процентах (выбираем бОльшую)

    //1) Проверяем глобальную скидку (Redis):
    const globalSaleRaw = await redis.get("global_sale");
    if (globalSaleRaw) {
      const { year, percent } = JSON.parse(globalSaleRaw);
      if (motorcycle.year === year) {
        appliedDiscount = percent;
      }
    }

    //2) Проверяем персональную скидку (Postgres):
    if (userId) {
      const personalSale = await prisma.personalDiscount.findFirst({
        where: {
          userId,
          motorcycleId: motorcycle.id,
          expiresAt: { gt: new Date() }, //Еще не истекла
        },
      });

      if (personalSale && personalSale.discountPercent > appliedDiscount) {
        appliedDiscount = personalSale.discountPercent; //Персональная скидка (фикс 20%) приоритетнее
      }
    }

    //Применяем процентную скидку:
    if (appliedDiscount > 0) {
      finalPrice = Math.round(finalPrice * (1 - appliedDiscount / 100));
    }

    return {
      originalPrice: motorcycle.price,
      finalPrice,
      discountPercent: appliedDiscount > 0 ? appliedDiscount : null,
      isPersonal: appliedDiscount === 20, //Для баджа на фронте
    };
  }
}

export const discountLogic = new DiscountLogic();
