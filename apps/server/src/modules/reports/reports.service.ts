//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
import { Statistics } from "./types.js";

export class ReportsService {
  //Метод сбора статистики за указанный период:
  async getStatistics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    //1) Топ-5 продаваемых мотоциклов
    const topSellers = await prisma.orderItem.groupBy({
      by: ["motorcycleId"],
      _sum: { quantity: true },
      where: { order: { status: "PAID", createdAt: { gte: startDate } } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    //Обогащаем данными о моделях:
    let enrichedTopSellers = [] as any;

    if (topSellers.length > 0) {
      const topBikeIds = topSellers.map((item) => item.motorcycleId);

      const motorcycles = await prisma.motorcycle.findMany({
        where: { id: { in: topBikeIds } },
        select: {
          id: true,
          model: true,
          brand: { select: { name: true } },
        },
      });

      //Создаем карту в памяти для моментального поиска по ID за O(1):
      const bikeMap = new Map(motorcycles.map((m) => [m.id, m]));

      enrichedTopSellers = topSellers.map((item) => {
        const moto = bikeMap.get(item.motorcycleId);
        return {
          model: moto
            ? `${moto.brand.name} ${moto.model}`
            : "Неизвестная модель",
          quantity: item._sum.quantity || 0,
        };
      });
    }

    //2) Складской отчет (критические остатки):
    const lowStock = await prisma.stock.findMany({
      where: { quantity: { lte: 1 } }, //Один или менее мотоцикл на складе
      include: { motorcycle: true, warehouse: true },
    });

    //3) Общие финансовые показатели:
    const finance = await prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: startDate } },
      _sum: { totalPrice: true },
      _count: { id: true },
    });

    return {
      topSellers: enrichedTopSellers,
      lowStock,
      totalRevenue: finance._sum.totalPrice || 0,
      ordersCount: finance._count.id,
      period: days,
    } as Statistics;
  }
}

export const reportsService = new ReportsService();
