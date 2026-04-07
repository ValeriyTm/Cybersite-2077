import { YooCheckout, ICreatePayment } from "@a2seven/yoo-checkout";
import { v4 as uuidv4 } from "uuid";

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID!,
  secretKey: process.env.YOOKASSA_SECRET_KEY!,
});

export class PaymentService {
  static async createPayment(
    orderId: string,
    amount: number,
    description: string,
  ) {
    const idempotenceKey = uuidv4(); // Ключ идемпотентности, чтобы запрос с одним и тем же uuid поспринимался как тот же самый (чтобы операция не прошла дважды)

    const createPayload: ICreatePayment = {
      amount: {
        value: amount.toFixed(2),
        currency: "RUB",
      },
      payment_method_data: {
        type: "bank_card",
      },
      confirmation: {
        //Что делаем после платежа - редиректим на указанный URL:
        type: "redirect",
        return_url: process.env.YOOKASSA_RETURN_URL!,
      },
      description: description,
      metadata: {
        orderId: orderId, //Передаем ID заказа, чтобы поймать его в вебхуке
      },
      capture: true, //Автоматическое списание (без холдирования)
    };

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
}
