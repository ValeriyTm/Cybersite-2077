//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";

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
    const enrichedTopSellers = await Promise.all(
      topSellers.map(async (item) => {
        const moto = await prisma.motorcycle.findUnique({
          where: { id: item.motorcycleId },
          select: { model: true, brand: { select: { name: true } } },
        });
        return {
          model: `${moto?.brand.name} ${moto?.model}`,
          quantity: item._sum.quantity,
        };
      }),
    );

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
    };
  }
}

export const reportsService = new ReportsService();
