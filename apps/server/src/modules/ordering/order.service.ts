//Клиент призмы для работы с БД:
import { prisma } from "@repo/database";
//Пространство имен из библиотеки:
import { Prisma } from "@repo/database/generated/prisma";
import { ReviewModel } from "../reviews/review.model.js";
import { searchService } from "../catalog/search.service.js";
import { PaymentService } from "../payment/payment.service.js";

export class OrderService {
  //Создание заказа с резервированием остатков и обновлением профиля
  async createOrder(userId: string, data: any) {
    const { items, address, coords, deliveryInfo, totalPrice } = data;

    //1.Транзакция в БД:
    const order = await prisma.$transaction(async (tx) => {
      //1.1.Создаем запись заказа и товаров в нем:
      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING", //Резерв на 1 час
          address,
          deliveryLat: coords.lat,
          deliveryLng: coords.lng,
          distance: deliveryInfo.distanceKm,
          deliveryCost: deliveryInfo.cost,
          estimatedDate: new Date(deliveryInfo.estimatedDate),
          totalPrice,
          warehouseId: deliveryInfo.warehouse.id,
          paymentStatus: "pending", //Начальный статус платежа
          items: {
            create: items.map((item: any) => ({
              motorcycleId: item.id,
              quantity: item.quantity,
              priceAtOrder: item.price, //Фиксируем цену на момент покупки
            })),
          },
        },
        include: { items: true },
      });

      //1.2.Резервируем товар на складе (reserved += quantity)
      for (const item of items) {
        await tx.stock.update({
          where: {
            motorcycleId_warehouseId: {
              motorcycleId: item.id,
              warehouseId: deliveryInfo.warehouse.id,
            },
          },
          data: {
            //Увеличиваем только резерв, а физическое количество (quantity) пока не трогаем
            reserved: { increment: item.quantity },
          },
        });
      }

      //1.3.Обновляем адрес по умолчанию у пользователя (PostGIS + поля) в таблице users:
      //(используем $executeRaw для работы с типом geometry)
      await tx.$executeRaw`
        UPDATE "users" 
        SET 
          location = ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326),
          "defaultAddress" = ${address},
          "defaultLat" = ${coords.lat},
          "defaultLng" = ${coords.lng}
        WHERE id = ${userId}
      `;

      //1.4.Фиксируем использование промокода
      if (data.promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { code: data.promoCode.toUpperCase() },
        });

        if (promo) {
          await tx.usedPromo.create({
            data: {
              userId,
              promoCodeId: promo.id,
            },
          });
        }
      }

      //1.5.Генерируем платеж в ЮKassa:
      // Достаем email юзера (он нам нужен для чека)
      const user = await tx.user.findUnique({ where: { id: userId } });

      const payment = await PaymentService.createPayment(
        order.id,
        totalPrice,
        order.items, //Передаем товары
        user?.email || "test@test.ru", //Передаем email юзера
        `Оплата заказа №${order.orderNumber}`,
      );

      //1.6.Сохраняем данные платежа в заказ:
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentId: payment.id,
          paymentUrl: payment.confirmation.confirmation_url,
        },
        include: { items: true },
      });

      //1.7.Возвращаем заказ
      return updatedOrder;
    });

    //2.Обновляем остатки в Elasticsearch:
    try {
      //Проходим по всем купленным товарам и обновляем их остатки в индексе:
      for (const item of items) {
        await searchService.updateStockInElastic(item.id);
      }
      console.log(
        `Остатки для заказа №${order.orderNumber} обновлены в Elastic`,
      );
    } catch (error) {
      //Если Elastic упал — просто логируем, заказ-то в БД уже создан успешно
      console.error("Ошибка обновления Elastic после заказа:", error);
    }

    return order;
  }

  //Получить все заказы пользователя:
  async getUserOrders(userId: string, status?: string) {
    const orders = await prisma.order.findMany({
      where: {
        userId,
        //Если статус пришел, фильтруем по нему. Если нет — отдаем всё.
        status: status ? (status as any) : undefined,
      },
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

    //Проверяем наличие отзывов в MongoDB:
    return await Promise.all(
      orders.map(async (order) => {
        const itemsWithReviewStatus = await Promise.all(
          order.items.map(async (item) => {
            //Ищем отзыв по связке заказ + мотоцикл:
            const review = await ReviewModel.findOne({
              orderId: order.id,
              motorcycleId: item.motorcycleId,
            });

            return {
              ...item,
              isReviewed: !!review, //true, если отзыв найден
            };
          }),
        );

        return { ...order, items: itemsWithReviewStatus };
      }),
    );
  }
}

export const orderService = new OrderService();
