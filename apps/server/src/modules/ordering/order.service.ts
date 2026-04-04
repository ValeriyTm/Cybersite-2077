//Клиент призмы для работы с БД:
import { prisma } from "@repo/database";
//Пространство имен из библиотеки:
import { Prisma } from "@repo/database/generated/prisma";

import { searchService } from "../catalog/search.service.js";

export class OrderService {
  //Создание заказа с резервированием остатков и обновлением профиля
  async createOrder(userId: string, data: any) {
    const { items, address, coords, deliveryInfo, totalPrice } = data;

    // Используем транзакцию для атомарности
    return await prisma.$transaction(async (tx) => {
      // 1. Создаем запись заказа и товаров в нем
      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING", // Резерв на 1 час
          address,
          deliveryLat: coords.lat,
          deliveryLng: coords.lng,
          distance: deliveryInfo.distanceKm,
          deliveryCost: deliveryInfo.cost,
          estimatedDate: new Date(deliveryInfo.estimatedDate),
          totalPrice,
          warehouseId: deliveryInfo.warehouse.id,
          // Вложенное создание позиций заказа
          items: {
            create: items.map((item: any) => ({
              motorcycleId: item.id,
              quantity: item.quantity,
              priceAtOrder: item.price, // Фиксируем цену на момент покупки!
            })),
          },
        },
        include: { items: true },
      });

      // 2. Резервируем товар на складе (reserved += quantity)
      for (const item of items) {
        await tx.stock.update({
          where: {
            motorcycleId_warehouseId: {
              motorcycleId: item.id,
              warehouseId: deliveryInfo.warehouse.id,
            },
          },
          data: {
            // Увеличиваем только резерв, физическое количество (quantity) пока не трогаем
            reserved: { increment: item.quantity },
          },
        });
      }

      // 3. Обновляем адрес по умолчанию у пользователя (PostGIS + поля) в таблице users:
      // Используем $executeRaw для работы с типом geometry
      await tx.$executeRaw`
        UPDATE "users" 
        SET 
          location = ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326),
          "defaultAddress" = ${address},
          "defaultLat" = ${coords.lat},
          "defaultLng" = ${coords.lng}
        WHERE id = ${userId}
      `;

      //Обновляем остатки в Elasticsearch:
      try {
        // Проходим по всем купленным товарам и обновляем их остатки в индексе
        for (const item of items) {
          await searchService.updateStockInElastic(item.id);
        }
        console.log(
          `✅ Остатки для заказа №${order.orderNumber} обновлены в Elastic`,
        );
      } catch (error) {
        // Если Elastic упал — просто логируем, заказ-то в БД уже создан успешно
        console.error("⚠️ Ошибка обновления Elastic после заказа:", error);
      }

      return order;
    });
  }

  //Получить все заказы пользователя:
  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            motorcycle: {
              include: {
                images: {
                  where: { isMain: true }, //Берем только главное фото
                  take: 1,
                },
                brand: true,
              },
            },
          },
        },
        warehouse: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const orderService = new OrderService();
