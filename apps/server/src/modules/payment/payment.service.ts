import { YooCheckout, ICreatePayment } from "@a2seven/yoo-checkout";
import { v4 as uuidv4 } from "uuid";

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID!,
  secretKey: process.env.YOOKASSA_SECRET_KEY!,
});

export class PaymentService {
  //Создание платежа:
  static async createPayment(
    orderId: string,
    amount: number,
    items: any[],
    customerEmail: string,
    description: string,
  ) {
    const idempotenceKey = uuidv4(); //Ключ идемпотентности, чтобы запрос с одним и тем же uuid поспринимался как тот же самый (чтобы операция не прошла дважды)

    const createPayload: ICreatePayment = {
      amount: {
        value: (amount / 1000).toFixed(2), //Уменьшаем суммы, чтобы ЮKassa пропустила
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
        items: items.map((item: any) => ({
          description: item.motorcycle?.model || "Мотоцикл", // Название
          quantity: item.quantity.toFixed(2), // Кол-во (строкой)
          amount: {
            value: ((item.priceAtOrder || item.price) / 1000).toFixed(2), // Цена за 1 шт / 1000
            currency: "RUB",
          },
          vat_code: 1, //1 — без НДС (для тестов)
          payment_mode: "full_payment",
          payment_subject: "commodity",
        })),
      },
    };

    // return await checkout.createPayment(createPayload, idempotenceKey);

    try {
      //Совершаем платеж с указанными параметрами:
      const payment = await checkout.createPayment(
        createPayload,
        idempotenceKey,
      );
      return payment;
    } catch (error) {
      console.error("YooKassa Error:", error);
      throw new Error("Ошибка при создании платежа");
    }
  }

  //Возврат:
  static async createRefund(paymentId: string, amount: number) {
    const idempotenceKey = uuidv4();

    try {
      const refund = await checkout.createRefund(
        {
          payment_id: paymentId,
          amount: {
            value: amount.toFixed(2),
            currency: "RUB",
          },
        },
        idempotenceKey,
      );

      return refund;
    } catch (error) {
      console.error("Ошибка возврата:", error);
      throw error;
    }
  }
}
