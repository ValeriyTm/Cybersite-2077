import { EventEmitter } from "events";

//Единая шина событий:
export const eventBus = new EventEmitter();

//Типы событий:
export const EVENTS = {
  ORDER_CREATED: "order.created",
  ORDER_PAID: "order.paid",
  REVIEW_ADDED: "review.added",
  DISCOUNT_GENERATED: "discount.generated",
  ORDER_DELIVERY_END: "delivery.ended",
  ACCOUNT_CREATED: "account.created",
  FORGOT_PASSWORD: "forgot.password",
  DISCOUNTS_GENERATED: "discounts.generated",
  SUPPORT_TICKET_CREATED: "support.ticket.created",
};
