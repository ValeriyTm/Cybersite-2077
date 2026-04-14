//Для работы с событиями:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Сервисы модуля Notifications:
import { telegramService } from "./telegram.service.js";
import { mailService } from "src/modules/notifications/mail.service.js";
//Логгер Grafana Loki:
import { logger } from "src/shared/lib/logger.js";

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
    try {
      //Шлем письмо клиенту:
      await mailService.sendDeliveryMail(
        order.user.email,
        order.orderNumber,
        order.address,
      );

      //Шлем себе в Telegram (чтобы знать, что заказ юзеру доставлен):
      await telegramService.sendMessage(
        `🚚 <b>ЗАКАЗ ДОСТАВЛЕН</b>\n————————————————\nЗаказ: <code>#${order.orderNumber}</code>\nАдрес: ${order.address}`,
      );
    } catch (error) {
      logger.error(
        `[EventBus] Critical failure: Delivered status mail not sent to ${order.user.email}`,
      ); //Логгируем в Loki
      console.log("Возникла ошибка с отправкой письма: ", error);
    }
  });

  //6) Реакция на событие регистрации нового аккаунта:
  eventBus.on(EVENTS.ACCOUNT_CREATED, async (email, activationLink) => {
    try {
      //Шлем письмо клиенту со ссылкой активации:
      await mailService.sendActivationMail(email, activationLink);
    } catch (error) {
      logger.error(
        `[EventBus] Critical failure: Activation mail not sent to ${email}`,
      ); //Логгируем в Loki
      console.log("Возникла ошибка с отправкой письма: ", error);
    }
  });

  //7) Реакция на приход от юзера запроса на смену пароля через FORGOT PASSWORD:
  eventBus.on(EVENTS.FORGOT_PASSWORD, async (email, link) => {
    try {
      //Шлем юзеру письмо со ссылкой на форму смены пароля:
      await mailService.sendResetPasswordMail(email, link);
    } catch (error) {
      logger.error(
        `[EventBus] Critical failure: Reset password mail not sent to ${email}`,
      ); //Логгируем в Loki
      console.log("Возникла ошибка с отправкой письма: ", error);
    }
  });

  //8) Реакция на событие генерации персональных скидок:
  eventBus.on(
    EVENTS.DISCOUNTS_GENERATED,
    async (email, model, brand, slug, oldPrice, newPrice) => {
      try {
        //Шлем юзеру письмо с информацией о персональной скидкой:
        await mailService.sendLuckyBikeMail(
          email,
          model,
          brand,
          slug,
          oldPrice,
          newPrice,
        );
      } catch (error) {
        logger.error(
          `[EventBus] Critical failure: Personal discount mail not sent to ${email}`,
        ); //Логгируем в Loki
        console.log("Возникла ошибка с отправкой письма: ", error);
      }
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
