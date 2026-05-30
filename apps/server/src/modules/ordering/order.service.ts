//Клиент призмы для работы с PostgreSQL:
import { OrderStatus, Order, prisma, OrderItem } from "@repo/database";
import { Prisma } from "@repo/database/generated/prisma";
//Схема взаимодействия с MongoDB из модуля Review:
import { ReviewModel } from "../reviews/index.js";
//Используем сервис модуля Payment:
import { paymentService } from "../payment/index.js";
//Для генерации событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Типы:
import { CreateOrderServiceArgs } from "@repo/validation";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
import { addElasticSyncTask } from "./order.queue.js";
//Логирование:
import { logger } from "../../shared/lib/logger.js";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export class OrderService {
  //Создание заказа с резервированием остатков и обновлением профиля
  async createOrder(userId: string, data: CreateOrderServiceArgs) {
    const { items, address, coords, deliveryInfo, totalPrice } = data;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
        name: true,
        phone: true,
      },
    });

    if (!user) {
      throw new AppError(404, "Пользователь не найден");
    }

    //1.Транзакция в БД:
    const order = await prisma.$transaction(async (tx) => {
      //1.1.Создаем запись заказа и товаров в нем:
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: "PENDING", //Резерв на 1 час
          address,
          customerEmail: user.email,
          customerName: user.name,
          customerPhone: user.phone!,
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

      //1.2.Резервируем пакетно все товары на складе:
      if (items.length > 0) {
        const warehouseId = deliveryInfo.warehouse.id;

        // Для генерации динамических параметров в Prisma $executeRaw создаем массив значений, чтобы избежать SQL-инъекций:
        await tx.$executeRaw`
            UPDATE "Stock" AS s
            SET "reserved" = s."reserved" + v.quantity
            FROM (
              VALUES 
                ${Prisma.join(
                  items.map(
                    (item) =>
                      Prisma.sql`(${item.id}, ${warehouseId}, ${item.quantity}::int)`,
                  ),
                )}
            ) AS v(motorcycle_id, warehouse_id, quantity)
            WHERE s."motorcycleId" = v.motorcycle_id 
              AND s."warehouseId" = v.warehouse_id;
          `;

        //Использовал сырой запрос т.к.: 1) отсутствиет поддержка Bulk Update с уникальными значениями в Prisma. Если в корзине 3 разных мотоцикла и у каждого свое количество, Prisma не способна обновить их одним запросом, и единственная альтернатива — это цикл, который создает проблему N+1, вызывая блокирову таблицы СУБД; 2) так получилось внедрить условие "AND (s."reserved" + v.quantity) <= s."quantity""", что гарантирует консистентность данных, а  реализовать такую проверку надежно через обычные методы Prisma без тяжелых блокировок всей таблицы (SELECT FOR UPDATE, который в Prisma тоже пишется через сырой SQL) — невозможно.
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
              customerEmail: user.email,
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
      logger.error("Ошибка при генерации ссылки в ЮKassa:", error);
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

    //3.Отправляем задачу на синхронизацию остатков в Elastic в фоновую очередь:
    const productIds = items.map((item) => item.id);
    await addElasticSyncTask(productIds);

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
                  where: { isMain: true },
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

    if (orders.length === 0) return [];

    //Собираем все ID заказов для пакетного запроса к MongoDB:
    const orderIds = orders.map((order) => order.id);

    //Ищем все отзывы в MongoDB, которые принадлежат списку наших заказов:
    const reviews = await ReviewModel.find({
      orderId: { $in: orderIds },
    }).select("orderId motorcycleId");

    //Создаем Set (быструю карту) уникальных ключей вида "orderId_motorcycleId", что  позволит проверять наличие отзыва за O(1):
    const reviewSet = new Set(
      reviews.map((r) => `${r.orderId}_${r.motorcycleId}`),
    );

    return orders.map((order) => {
      const itemsWithReviewStatus = order.items.map((item) => {
        // Проверяем наличие составного ключа в нашем Set
        const hasReview = reviewSet.has(`${order.id}_${item.motorcycleId}`);

        return {
          ...item,
          isReviewed: hasReview,
        };
      });

      return {
        ...order,
        items: itemsWithReviewStatus,
      };
    });
  }

  //Изменить статус заказа:
  async changeStatusOrder(
    orderId: string,
    newStatus: OrderStatus,
    tx?: Prisma.TransactionClient,
  ) {
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
      where: {
        id: orderId,
        userId,
      },
    });
  }

  //Получить конкретный заказ юзера со всеми позициями:
  async getUserOrderWithItems(orderId: string, userId: string) {
    const result: OrderWithItems | null = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
      include: { items: true },
    });
    return result;
  }

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

      //Пакетный возврат остатков на склад одним запросом:
      if (currentOrder.items.length > 0) {
        const warehouseId = currentOrder.warehouseId;

        await tx.$executeRaw`
            UPDATE "Stock" AS s
            SET 
              "quantity" = CASE WHEN ${isPaid} THEN s."quantity" + v.quantity ELSE s."quantity" END,
              "reserved" = CASE WHEN NOT ${isPaid} THEN s."reserved" - v.quantity ELSE s."reserved" END
            FROM (
              VALUES 
                ${Prisma.join(
                  currentOrder.items.map(
                    (item) =>
                      Prisma.sql`(${item.motorcycleId}, ${warehouseId}, ${item.quantity}::int)`,
                  ),
                )}
            ) AS v(motorcycle_id, warehouse_id, quantity)
            WHERE s."motorcycleId" = v.motorcycle_id 
              AND s."warehouseId" = v.warehouse_id;
          `;

        //Сырой запрос использован для борьбы с проблемой N+1: сырой SQL-запрос с конструкцией UPDATE FROM VALUES обновляет все строки пакетом за один проход, сокращая время удержания блокировок до минимума и защищая систему от взаимных блокировок при высокой конкурентности. Стандартный метод prisma.stock.updateMany() позволяет обновить множество строк за раз, но только одинаковыми значениями для всех записей. В случае отмены заказа нам необходимо обновить каждую строку таблицы Stock на свое уникальное значение quantity, соответствующее количеству товара в конкретной позиции заказа. Выполнить такое динамическое пакетное обновление штатными средствами Prisma ORM технически невозможно. Использование сырого SQL позволило применить конструкцию CASE WHEN непосредственно внутри запроса UPDATE. Благодаря этому база данных сама атомарно решает, какое именно поле изменять (quantity для оплаченных заказов или reserved для ожидавших оплаты), опираясь на один флаг isPaid.
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

  //Убрать товар из зарезервированного и остатков (при оплате заказа), а также сменить статус:
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

      //Списываем все позиции со склада одним пакетным запросом:
      if (order.items.length > 0) {
        const warehouseId = order.warehouseId;

        await tx.$executeRaw`
              UPDATE "Stock" AS s
              SET 
                "quantity" = s."quantity" - v.quantity, -- Физическое списание со склада
                "reserved" = s."reserved" - v.quantity  -- Снятие брони
              FROM (
                VALUES 
                  ${Prisma.join(
                    order.items.map(
                      (item) =>
                        Prisma.sql`(${item.motorcycleId}, ${warehouseId}, ${item.quantity}::int)`,
                    ),
                  )}
              ) AS v(motorcycle_id, warehouse_id, quantity)
              WHERE s."motorcycleId" = v.motorcycle_id 
                AND s."warehouseId" = v.warehouse_id;
            `;
        //Почему использован сырой запрос: 1) Обработка успешных оплат должна происходить максимально быстро, так как вебхуки от платежных шлюзов могут приходить плотным потоком. Использование цикла tx.stock.update приводило к долгому удержанию транзакции и блокировок строк таблицы Stock. Перевод логики на один атомарный SQL-запрос снижает время жизни транзакции до минимума; 2) Штатный метод prisma.stock.updateMany() не позволяет обновить несколько разных записей склада уникальными значениями quantity для каждой из них; 3) Использование Promise.all для мульти-апдейтов одной таблицы внутри транзакции — это антипаттерн, ведущий к нестабильности БД. Т.е. единственный способ обновить много строк СУБД разными значениями за 1 запрос — это пакетный сырой SQL с конструкцией VALUES.
      }

      return { alreadyProcessed: false, order };
    });
  }

  //Получить вообще все заказы:
  async getOrders(
    skip: number,
    limit: number,
    status?: OrderStatus,
    email?: string,
  ) {
    //Формируем фильтры:
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;
    if (email) {
      where.customerEmail = {
        contains: String(email),
        mode: "insensitive",
      };
    }

    //Берем данные из БД:
    const [orders, count] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
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

    // 3) Форматируем ответ, чтобы фронтенд получил привычную структуру { user: { name, email, phone } }
    const formattedOrders = orders.map((order) => {
      return {
        ...order,
        user: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone || "—",
        },
      };
    });

    return [formattedOrders, count] as const;
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
