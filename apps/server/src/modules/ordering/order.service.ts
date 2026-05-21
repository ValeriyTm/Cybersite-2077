//Клиент призмы для работы с PostgreSQL:
import { OrderStatus, Order, prisma, OrderItem } from "@repo/database";
//Схема взаимодействия с MongoDB из модуля Review:
import { ReviewModel } from "../reviews/index.js";
//Используем сервис модуля Payment:
import { paymentService } from "../payment/index.js";
//Для генерации событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Поисковый сервис модуля Catalog:
import { searchService } from "../catalog/search.service.js";
//Типы:
import { CreateOrderServiceArgs } from "@repo/validation";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export class OrderService {
  //Создание заказа с резервированием остатков и обновлением профиля
  async createOrder(userId: string, data: CreateOrderServiceArgs) {
    const { items, address, coords, deliveryInfo, totalPrice } = data;

    //1.Транзакция в БД:
    const order = await prisma.$transaction(async (tx) => {
      //1.1.Создаем запись заказа и товаров в нем:
      const createdOrder = await tx.order.create({
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
            create: items.map((item) => ({
              motorcycleId: item.id,
              quantity: item.quantity,
              priceAtOrder: item.price, //Фиксируем цену на момент покупки
            })),
          },
        },
        include: { items: true, user: true },
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
          //Фиксируем, какой юзер использовал (чтобы не применил дважды):
          await tx.usedPromo.create({
            data: {
              userId,
              promoCodeId: promo.id,
            },
          });
          //Увеличиваем счётчик общего использования промокода (чтобы в админке отображать):
          await tx.promoCode.update({
            where: { id: promo.id },
            data: {
              usedCount: { increment: 1 }, // Атомарное увеличение на 1
            },
          });
        }
      }

      return createdOrder; // Транзакция завершается тут, все блокировки с таблиц снимаются!
    });

    //2.Сетевой запрос к ЮКассе:
    //2.1.Генерируем платеж в ЮKassa:
    let payment;
    try {
      payment = await paymentService.createPayment(
        order.id,
        totalPrice,
        order.items,
        order.user?.email || "test@example.com",
        `Оплата заказа №${order.orderNumber}`,
      );
    } catch (error) {
      console.error("Ошибка при генерации ссылки в ЮKassa:", error);
      // Обработка ошибки: заказ уже создан как PENDING, пользователь сможет попробовать оплатить его позже из личного кабинета
      throw new AppError(
        500,
        "Заказ создан, но не удалось сгенерировать ссылку на оплату. Попробуйте позже из личного кабинета.",
      );
    }
    //2.2.Сохраняем данные платежа в заказ:
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: payment.id,
        paymentUrl: payment.confirmation.confirmation_url,
      },
      include: { items: true },
    });

    //2.3.Создаём событие для оповещений в ТГ:
    eventBus.emit(EVENTS.ORDER_CREATED, order);

    //3.Обновляем остатки в Elasticsearch:
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

    return updatedOrder;
  }

  //Получить все заказы пользователя:
  async getUserOrders(userId: string, status?: string) {
    const orders = await prisma.order.findMany({
      where: {
        userId,
        //Если статус пришел, фильтруем по нему. Если нет — отдаем всё.
        status: status ? (status as OrderStatus) : undefined,
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

  //Изменить статус заказа:
  async changeStatusOrder(orderId: string, newStatus: string, tx?: any) {
    const client = tx || prisma; //Если tx передан, то используем его (для случая, когда мы вызываем этот метод внутри транзакции)
    return await client.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true },
    });
  }

  //Получить список активных заказов юзера:
  async getActiveOrdersCount(userId: string) {
    return await prisma.order.count({
      where: {
        userId,
        status: { in: ["PENDING", "PAID", "DELIVERY"] }, //Статусы, при которых заказы считаются активными
      },
    });
  }

  //Получить конкретный заказ юзера:
  async getUserOrder(orderId: string, userId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId, userId },
    });
  }

  //Получить конкретный заказ юзера со всеми позициями:
  async getUserOrderWithItems(orderId: string, userId: string) {
    const result: OrderWithItems | null = await prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { items: true },
    });
    return result;
  }

  //Убрать товар из зарезервированного (при отмене заказа), а также сменить статус:
  // async cancelUserOrder(orderId: string, order: OrderWithItems) {
  //   //Транзакция (смена статуса + возврат резерва на склад):
  //   return await prisma.$transaction(async (tx) => {
  //     // Меняем статус заказа:
  //     const updated = await tx.order.update({
  //       where: { id: orderId },
  //       data: { status: "CANCELED", paymentStatus: "canceled" },
  //     });

  //     //Возвращаем товар в доступные остатки (уменьшаем резерв):
  //     for (const item of order.items) {
  //       await tx.stock.update({
  //         where: {
  //           motorcycleId_warehouseId: {
  //             motorcycleId: item.motorcycleId,
  //             warehouseId: order.warehouseId,
  //           },
  //         },
  //         data: {
  //           // Если заказ был PAID, значит quantity уже было списано (в вебхуке); если заказ был PENDING, значит списан только reserved:
  //           ...(order.status === "PAID"
  //             ? { quantity: { increment: item.quantity } }
  //             : { reserved: { decrement: item.quantity } }),
  //         },
  //       });
  //     }

  //     return updated;
  //   });
  // }

  //Отменить заказ:
  async cancelUserOrder(orderId: string) {
    //Транзакция (смена статуса + возврат резерва на склад):
    return await prisma.$transaction(async (tx) => {
      //Находим заказ, чтобы узнать его текущий статус:
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!currentOrder) {
        throw new Error(`Заказ с order.id "${orderId}" не найден`);
      }

      // Идемпотентность: если он уже отменен или возвращен:
      if (currentOrder.status === "CANCELED") {
        return currentOrder;
      }

      //2.Определяем, как менять данные на складе, опираясь на текущий статус:
      //Если заказ был PAID — восстанавливаем физическое количество (quantity).
      //Если заказ был PENDING — убираем бронь (reserved):
      const isPaid = currentOrder.status === "PAID";

      //Возвращаем товар в доступные остатки (уменьшаем резерв):
      for (const item of currentOrder.items) {
        await tx.stock.update({
          where: {
            motorcycleId_warehouseId: {
              motorcycleId: item.motorcycleId,
              warehouseId: currentOrder.warehouseId,
            },
          },
          data: isPaid
            ? { quantity: { increment: item.quantity } }
            : { reserved: { decrement: item.quantity } },
          // Если заказ был PAID, значит quantity уже было списано (в вебхуке); если заказ был PENDING, значит списан только reserved:
        });
      }

      //Меняем статус самого заказа:
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELED",
          paymentStatus: isPaid ? "refunded" : "canceled",
        },
        include: { items: true },
      });

      return updatedOrder;
    });
  }

  //Убрать товар из зарезервированного и остатков (при оплате заказа) (тестовый эндпоинт), а также сменить статус:
  async confirmUserOrder(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      //1.Смотрим текущий статус оплаты:
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true },
      });

      if (!currentOrder) {
        throw new Error(`Заказ ${orderId} не найден`);
      }

      //2.Идемпотентность: если заказ уже оплачен, то помечаем флагом:
      if (currentOrder.paymentStatus === "succeeded") {
        return { alreadyProcessed: true, order: null };
      }

      //Обновляем статус заказа:
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paymentStatus: "succeeded" },
        include: { items: true },
      });

      //Списываем со склада:
      for (const item of order.items) {
        await tx.stock.update({
          where: {
            motorcycleId_warehouseId: {
              motorcycleId: item.motorcycleId,
              warehouseId: order.warehouseId,
            },
          },
          data: {
            quantity: { decrement: item.quantity }, //Физическое списание со склада
            reserved: { decrement: item.quantity }, //Снятие брони
          },
        });
      }

      return { alreadyProcessed: false, order };
    });
  }

  //Получить вообще все заказы:
  async getOrders(
    skip: number,
    limit: number,
    status?: string,
    email?: string,
  ) {
    //Формируем фильтры:
    const where: any = {};
    if (status) where.status = status;
    if (email) {
      where.user = {
        email: { contains: String(email), mode: "insensitive" },
      };
    }

    return await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
          items: {
            include: {
              motorcycle: { select: { model: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);
  }

  //Изменить статус заказа:
  async updateOrderStatus(id: string, status: OrderStatus) {
    return await prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}

export const orderService = new OrderService();
