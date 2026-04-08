import { EventEmitter } from "events";

// Создаем единую шину событий
export const eventBus = new EventEmitter();

// Опишем типы событий, чтобы не ошибиться в названиях
export const EVENTS = {
  ORDER_CREATED: "order.created",
  ORDER_PAID: "order.paid",
  REVIEW_ADDED: "review.added",
  DISCOUNT_GENERATED: "discount.generated",
  ORDER_DELIVERY_END: "delivery.ended",
};
