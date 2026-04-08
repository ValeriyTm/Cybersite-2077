import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
import { TelegramService } from "./telegram.service.js";

export const initNotificationListeners = () => {
  // 1. Слушаем оплату заказа
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
    await TelegramService.sendMessage(message);
  });

  // 2. Слушаем создание нового заказа
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
    await TelegramService.sendMessage(message);
  });

  // 3. Уведомление о новом отзыве (MongoDB)
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
    await TelegramService.sendMessage(message);
  });

  // 4. Отчет о работе BullMQ (Скидки)
  eventBus.on(EVENTS.DISCOUNT_GENERATED, async (data) => {
    const message = `
📊 <b>ОТЧЕТ ПО АКЦИЯМ</b>
————————————————
<b>Глобальная скидка:</b> ${data.year} год (-${data.percent}%)
<b>Персональные скидки:</b> ${data.personalCount} пользователей
<b>Промокоды:</b> Сгенерировано ${data.promoCount} новых кодов
————————————————
<i>Система лояльности обновлена успешно!</i>
  `;
    await TelegramService.sendMessage(message);
  });
};
