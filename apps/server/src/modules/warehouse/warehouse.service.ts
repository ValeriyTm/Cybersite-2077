//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Пространство имен из библиотеки:
import { Prisma } from "@repo/database/generated/prisma";

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
  async findNearestWarehouseWithFullStock(
    lat: number,
    lng: number,
    items: { id: string; quantity: number }[],
  ) {
    //Перебираем склады по удаленности и выбираем только тот, на котором есть в наличии все позиции заказа:
    const itemIds = items.map((i) => i.id);
    const totalUniqueItems = itemIds.length;

    const warehouses: any[] = await prisma.$queryRaw`
    SELECT 
      w.id, w.name, w.city, w.lat, w.lng,
      ST_DistanceSphere(ST_MakePoint(w.lng, w.lat), ST_MakePoint(${lng}, ${lat})) / 1000 as "distanceKm" 
    FROM "Warehouse" w
    JOIN "Stock" s ON s."warehouseId" = w.id
    WHERE s."motorcycleId" IN (${Prisma.join(itemIds)}) 
      AND (s.quantity - s.reserved) >= 1 -- Проверяем, что хотя бы 1 есть (упрощенно)
    GROUP BY w.id
    HAVING COUNT(DISTINCT s."motorcycleId") = ${totalUniqueItems} -- Склад должен иметь все типы товаров из корзины
    ORDER BY "distanceKm" ASC
  `;
    //Используем ST_DistanceSphere для расчета расстояния в метрах по дуге сферы (Земли). Делим на 1000, чтобы получить километры.

    //Возвращаем ближайший из подходящих или null:
    return warehouses.length > 0 ? warehouses[0] : null;
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

    //Временное изменение для теста:
    // const testDate = new Date();
    // testDate.setMinutes(testDate.getMinutes() + 2); // Доставка через 2 минуты
    // const estimatedDate = testDate;

    return {
      cost,
      days,
      estimatedDate,
      distanceKm: Math.round(distanceKm),
    };
  }
}

export const warehouseService = new WarehouseService();
