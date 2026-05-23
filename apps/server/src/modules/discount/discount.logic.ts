//-----------Логика расчёта цены с учетом скидок:-------------//
//Клиент Redis для работы с быстрым хранилищем:
import { redis } from "../../shared/lib/redis.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Типы:
import { MotorcycleFullServer } from "@repo/types";

type MotorcycleFromDB = Omit<
  MotorcycleFullServer,
  | "siteCategory"
  | "discountData"
  | "stocks"
  | "totalInStock"
  | "images"
  | "brand"
> & {
  //Исправляем структуру brand, делая image зануляемым:
  brand: Omit<MotorcycleFullServer["brand"], "image"> & {
    image: string | null;
  };
  //Возвращаем правильный тип для изображений:
  images: MotorcycleFullServer["images"];
};

export class DiscountLogic {
  //Метод вычисляет финальную цену мотоцикла для конкретного пользователя:
  async calculateFinalPrice(motorcycle: MotorcycleFromDB, userId?: string) {
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

  //Метод для работы с большим количеством данных:
  async calculateFinalPricesBulk(motorcycles: any[], userId?: string) {
    if (!motorcycles || motorcycles.length === 0) return [];

    //Запрашиваем глобальную скидку из Redis для всех товаров сразу:
    const globalSaleRaw = await redis.get("global_sale");
    let globalSale: { year: number; percent: number } | null = null;
    if (globalSaleRaw) {
      globalSale = JSON.parse(globalSaleRaw);
    }

    //Запрашиваем персональные скидки из Postgres для всех мотоциклов на странице:
    const personalSalesMap = new Map<string, number>();

    if (userId) {
      const motoIds = motorcycles.map((m) => m.id);

      const personalSales = await prisma.personalDiscount.findMany({
        where: {
          userId,
          motorcycleId: { in: motoIds }, // РЕШЕНИЕ N+1
          expiresAt: { gt: new Date() },
        },
      });

      //Сохраняем в Map для быстрого доступа O(1) в памяти:
      for (const sale of personalSales) {
        personalSalesMap.set(sale.motorcycleId, sale.discountPercent);
      }
    }

    //Синхронно в памяти рассчитываем цены для каждого мотоцикла:
    return motorcycles.map((motorcycle) => {
      let finalPrice = motorcycle.price;
      let appliedDiscount = 0;

      //Проверяем глобальную скидку:
      if (globalSale && motorcycle.year === globalSale.year) {
        appliedDiscount = globalSale.percent;
      }

      //Проверяем персональную скидку из нашей Map:
      const personalDiscountPercent = personalSalesMap.get(motorcycle.id);
      if (
        personalDiscountPercent &&
        personalDiscountPercent > appliedDiscount
      ) {
        appliedDiscount = personalDiscountPercent;
      }

      //Применяем процентную скидку:
      if (appliedDiscount > 0) {
        finalPrice = Math.round(finalPrice * (1 - appliedDiscount / 100));
      }

      return {
        originalPrice: motorcycle.price,
        finalPrice,
        discountPercent: appliedDiscount > 0 ? appliedDiscount : null,
        isPersonal: appliedDiscount === 20,
      };
    });
  }
}

export const discountLogic = new DiscountLogic();
