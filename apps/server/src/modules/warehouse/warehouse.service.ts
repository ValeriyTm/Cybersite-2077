//Клиент призмы для работы с БД:
import { prisma } from "@repo/database";

export class WarehouseService {
  //Проверяем, сколько товара доступно для формирования заказа:
  async getAvailableStock(motorcycleId: string): Promise<number> {
    const stocks = await prisma.stock.findMany({
      where: { motorcycleId },
      select: { quantity: true, reserved: true },
    });

    //Для получения доступного к заказу значения от физических остатков отнимаем зарезервированные остатки:
    const total = stocks.reduce((acc, s) => acc + (s.quantity - s.reserved), 0);
    return Math.max(0, total);
  }

  //Получаем список всех складов (для отображения меток на карте юзера):
  async getAll() {
    return prisma.warehouse.findMany();
  }

  //Определяем ближайший склад к координатам пользователя через PostGIS:
  async findNearestWarehouse(lat: number, lng: number) {
    //Используем ST_DistanceSphere для расчета расстояния в метрах по дуге сферы (Земли).
    //Делим на 1000, чтобы получить километры.
    const nearest: any[] = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        city, 
        lat, 
        lng,
        ST_DistanceSphere(
          ST_MakePoint(lng, lat), 
          ST_MakePoint(${lng}, ${lat})
        ) / 1000 as "distanceKm"
      FROM "Warehouse"
      ORDER BY "distanceKm" ASC
      LIMIT 1
    `;

    return nearest[0] || null;
  }

  //Рассчитываем стоимость и дату доставки:
  calculateDelivery(distanceKm: number) {
    //Считаем цену доставки по принципу 40 руб за 1 км:
    const cost = Math.ceil(distanceKm * 40);

    //Считаем срок доставки по принципу 1000 км = 1 день (минимум 1 день):
    const days = Math.max(1, Math.ceil(distanceKm / 1000));

    const estimatedFullDate = new Date();
    estimatedFullDate.setDate(estimatedFullDate.getDate() + days);
    const estimatedDate = estimatedFullDate.toISOString().split("T")[0]; //Обрезаю время, оставляя только дату

    return {
      cost,
      days,
      estimatedDate,
      distanceKm: Math.round(distanceKm),
    };
  }
}

export const warehouseService = new WarehouseService();
