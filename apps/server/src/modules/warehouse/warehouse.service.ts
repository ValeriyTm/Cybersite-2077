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
}

export const warehouseService = new WarehouseService();
