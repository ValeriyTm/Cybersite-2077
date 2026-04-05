import { redis } from "src/lib/redis.js";
import { prisma } from "@repo/database";

export class DiscountLogic {
  //Вычисляет финальную цену мотоцикла для конкретного пользователя
  static async calculateFinalPrice(motorcycle: any, userId?: string) {
    let finalPrice = motorcycle.price;
    let appliedDiscount = 0; // В процентах (выбираем бОльшую)

    // 1. Проверяем Глобальную скидку (Redis)
    const globalSaleRaw = await redis.get("global_sale");
    if (globalSaleRaw) {
      const { year, percent } = JSON.parse(globalSaleRaw);
      if (motorcycle.year === year) {
        appliedDiscount = percent;
      }
    }

    // 2. Проверяем Персональную скидку (Postgres)
    if (userId) {
      const personalSale = await prisma.personalDiscount.findFirst({
        where: {
          userId,
          motorcycleId: motorcycle.id,
          expiresAt: { gt: new Date() }, // Еще не истекла
        },
      });

      if (personalSale && personalSale.discountPercent > appliedDiscount) {
        appliedDiscount = personalSale.discountPercent; // Персональная скидка (20%) приоритетнее
      }
    }

    // Применяем процентную скидку
    if (appliedDiscount > 0) {
      finalPrice = Math.round(finalPrice * (1 - appliedDiscount / 100));
    }

    return {
      originalPrice: motorcycle.price,
      finalPrice,
      discountPercent: appliedDiscount > 0 ? appliedDiscount : null,
      isPersonal: appliedDiscount === 20, // Для баджа на фронте
    };
  }
}
