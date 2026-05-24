//Библиотека (не официальная, но указана на сайте Юкассы) для взаимодействия с Юкассой:
import {
  YooCheckout,
  ICreatePayment,
  ICreateRefund,
} from "@a2seven/yoo-checkout";
//Библиотека генерации uuid v4:
import { v4 as uuidv4 } from "uuid";
//Используем сервис модуля Ordering:
import { orderService } from "../ordering/index.js";
//Логирование:
import { logger } from "../../shared/lib/logger.js";

interface Item {
  orderId: string;
  id: string;
  motorcycleId: string;
  quantity: number;
  priceAtOrder: number;
}

interface ICreateRefundWithMetadata extends ICreateRefund {
  metadata?: Record<string, string>;
}

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID!,
  secretKey: process.env.YOOKASSA_SECRET_KEY!,
});

export class PaymentService {
  //Создание платежа:
  async createPayment(
    orderId: string,
    amount: number,
    items: Item[],
    customerEmail: string,
    description: string,
  ) {
    const idempotenceKey = uuidv4(); //Ключ идемпотентности, чтобы запрос с одним и тем же uuid поспринимался как тот же самый (чтобы операция не прошла дважды)

    const createPayload: ICreatePayment = {
      amount: {
        value: (amount / 1000).toFixed(2),
        //Уменьшаем суммы, чтобы ЮKassa пропустила, т.к. испольуем тестовый ЛК, а у него стоят лимиты по суммам
        currency: "RUB",
      },
      // payment_method_data: {
      //   type: "bank_card",
      // },
      confirmation: {
        //Что делаем после платежа - редиректим на указанный URL:
        type: "redirect",
        return_url: process.env.YOOKASSA_RETURN_URL!,
      },
      description: description,
      metadata: {
        orderId: orderId, //Передаем ID заказа, чтобы поймать его в вебхуке
      },
      capture: true, //Автоматическое списание (одноэтапный платеж без холдирования)
      //Кассовый чек:
      receipt: {
        customer: { email: customerEmail },
        items: items.map((item) => ({
          description: item.motorcycleId || "Мотоцикл", // Название
          quantity: item.quantity.toFixed(2), // Кол-во (строкой)
          amount: {
            value: (item.priceAtOrder / 1000).toFixed(2), // Цена за 1 шт, деленная на 1000 (т.к. лимиты тестовой юкассы ограничивают большие суммы)
            currency: "RUB",
          },
          vat_code: 1, //1 — без НДС (для тестов)
          payment_mode: "full_payment",
          payment_subject: "commodity",
        })),
      },
    };

    try {
      //Совершаем платеж с указанными параметрами:
      const payment = await checkout.createPayment(
        createPayload,
        idempotenceKey,
      );

      return payment;
    } catch (error) {
      logger.error("YooKassa Error:", error);
      throw new Error("Ошибка при создании платежа");
    }
  }

  //Инициируем возврат:
  async initiateRefund(paymentId: string, amount: number, orderId: string) {
    const idempotenceKey = uuidv4();

    try {
      const refundPayload: ICreateRefundWithMetadata = {
        payment_id: paymentId,
        amount: {
          value: amount.toFixed(2),
          currency: "RUB",
        },
        metadata: {
          orderId: orderId,
        },
      };
      const refund = await checkout.createRefund(refundPayload, idempotenceKey);

      return refund;
    } catch (error) {
      logger.error("Ошибка возврата:", error);
      throw error;
    }
  }

  //Осуществляем возврат остатков и изменение статуса заказа:
  async finishRefundOrCancel(orderId: string) {
    return orderService.cancelUserOrder(orderId);
  }

  //Изменяем статус заказа на PAID и списываем товар со склада (после успешной оплаты):
  async applyChangeAfterPayment(orderId: string) {
    //Выполняем смену статуса и списание остатков за одну транзакцию:
    return await orderService.confirmUserOrder(orderId);
  }

  //Используем Callback Verification для получения реальных данных с ЮКассы:
  async callbackVerification(paymentId: string) {
    return await checkout.getPayment(paymentId);
  }
}

export const paymentService = new PaymentService();
