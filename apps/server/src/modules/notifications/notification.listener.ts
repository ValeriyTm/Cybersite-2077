import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
import { telegramService } from "./telegram.service.js";
import { MailService } from "src/modules/notifications/mail.service.js";

export const initNotificationListeners = () => {
  //1) Реакция на событие оплаты заказа:
  eventBus.on(EVENTS.ORDER_PAID, async (order) => {
    const message = `
💰 <b>ОПЛАТА ПОЛУЧЕНА!</b>
————————————————
<b>Заказ:</b> <code>#${order.orderNumber}</code>
<b>Сумма:</b> <code>${order.totalPrice.toLocaleString()} ₽</code>
<b>Метод:</b> ЮKassa (Bank Card)
————————————————
<i>Пора готовить байк к отгрузке!</i> 🏍️
    `;
    await telegramService.sendMessage(message);
  });

  //2) Реакция на событие создания заказа:
  eventBus.on(EVENTS.ORDER_CREATED, async (order) => {
    const message = `
🛒 <b>НОВЫЙ ЗАКАЗ</b>
————————————————
<b>Заказ:</b> <code>#${order.orderNumber}</code>
<b>Сумма:</b> ${order.totalPrice.toLocaleString()} ₽
<b>Адрес:</b> ${order.address}
————————————————
<i>Статус: Ожидает оплаты</i>
    `;
    await telegramService.sendMessage(message);
  });

  //3) Реакция на событие создания отзыва на товар:
  eventBus.on(EVENTS.REVIEW_ADDED, async (review) => {
    const stars = "⭐".repeat(review.rating);
    const message = `
💬 <b>НОВЫЙ ОТЗЫВ</b>
————————————————
<b>Байк ID:</b> <code>${review.motorcycleId}</code>
<b>Автор:</b> ${review.userName}
<b>Оценка:</b> ${stars} (${review.rating}/5)

<b>Текст:</b>
<i>"${review.comment}"</i>
————————————————
<a href="http://localhost:5173/catalog/motorcycles/${review.motorcycleId}">Открыть на сайте</a>
  `;
    await telegramService.sendMessage(message);
  });

  //4) Реакция на событие принудилтельной генерации скидок и промокодов:
  eventBus.on(EVENTS.DISCOUNT_GENERATED, async (data) => {
    const message = `
📊 <b>ОТЧЕТ ПО АКЦИЯМ</b>
————————————————
<b>Глобальная скидка:</b> ${data.year} год (-${data.percent}%)
<b>Персональные скидки для:</b> ${data.personalCount} пользователей
<b>Промокоды недели:</b> ${data.promoCodes}
————————————————
<i>Система лояльности обновлена успешно!</i>
  `;
    await telegramService.sendMessage(message);
  });

  //5) Реакция на событие перехода заказа в статус "DELIVERED":
  eventBus.on(EVENTS.ORDER_DELIVERY_END, async (order) => {
    //Шлем письмо клиенту:
    await MailService.sendDeliveryMail(
      order.user.email,
      order.orderNumber,
      order.address,
    );

    //Шлем себе в Telegram (чтобы знать, что заказ юзеру доставлен):
    await telegramService.sendMessage(
      `🚚 <b>ЗАКАЗ ДОСТАВЛЕН</b>\n————————————————\nЗаказ: <code>#${order.orderNumber}</code>\nАдрес: ${order.address}`,
    );
  });

  //6) Реакция на событие регистрации нового аккаунта:
  eventBus.on(EVENTS.ACCOUNT_CREATED, async (email, activationLink) => {
    //Шлем письмо клиенту со ссылкой активации:
    await MailService.sendActivationMail(email, activationLink);
  });

  //7) Реакция на приход от юзера запроса на смену пароля через FORGOT PASSWORD:
  eventBus.on(EVENTS.FORGOT_PASSWORD, async (email, link) => {
    //Шлем юзеру письмо со ссылкой на форму смены пароля:
    await MailService.sendResetPasswordMail(email, link);
  });

  //8) Реакция на событие генерации персональных скидок:
  eventBus.on(
    EVENTS.DISCOUNTS_GENERATED,
    async (email, model, brand, slug, oldPrice, newPrice) => {
      //Шлем юзеру письмо с информацией о персональной скидкой:
      await MailService.sendLuckyBikeMail(
        email,
        model,
        brand,
        slug,
        oldPrice,
        newPrice,
      );
    },
  );

  //9) Реакция на событие отправки юзером формы в support:
  eventBus.on(EVENTS.SUPPORT_TICKET_CREATED, async (ticket) => {
    //Маппинг категорий на понятный язык:
    const categories: Record<string, string> = {
      TECHNICAL: "🛠 Техническая ошибка",
      ORDER: "📦 Вопрос по заказу",
      COOPERATION: "🤝 Сотрудничество",
      COMPLAINT: "🚫 Жалоба",
      OTHER: "💬 Другое",
    };

    const categoryName = categories[ticket.category] || ticket.category;
    const attachmentsCount = ticket.attachments?.length || 0;

    const message = `
📩 <b>НОВОЕ ОБРАЩЕНИЕ В ПОДДЕРЖКУ</b>
————————————————
<b>Категория:</b> ${categoryName}
<b>Отправитель:</b> ${ticket.firstName} ${ticket.lastName}
<b>Email:</b> <code>${ticket.email}</code>
<b>Телефон:</b> <code>${ticket.phone || "не указан"}</code>
————————————————
<b>Сообщение:</b>
<i>"${ticket.description}"</i>
————————————————
<b>Вложения:</b> ${attachmentsCount > 0 ? `📎 ${attachmentsCount} шт.` : "отсутствуют"}
<b>ID тикета:</b> <code>${ticket.id}</code>
  `;

    await telegramService.sendMessage(message);
  });
};
