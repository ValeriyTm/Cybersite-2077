
//Состояния:
import { useState } from "react";
import { useCancelOrder, useCompleteOrder } from "@/entities/ordering/model"; //Состояние активных заказов
//Компоненты:
import { PaymentModal } from "@/widgets/PaymentModal";
import { ActionConfirmModal, Button } from "@/shared/ui";
import { OrderItemRow } from "@/entities/ordering";
import { LeaveReviewButton } from "@/features/reviews";
//Прочее:
import { orderStatusTranslations } from "./categories";
//Типы:
import type { Order } from "@/entities/ordering/types/types";
//Стили:
import styles from "./OrderCard.module.scss";

export const OrderCard = ({ order }: { order: Order }) => {
  //Определяем статус заказа:
  const isDelivered = order.status === "DELIVERED";
  const isCompleted = order.status === "COMPLETED";
  const isCanceled = order.status === "CANCELED";
  const isDelivery = order.status === "DELIVERY";
  const canCancel = ["PENDING", "PAID"].includes(order.status);
  //Состояние для pre-payment модалки:
  const [isModalOpen, setIsModalOpen] = useState(false);
  //Состояние для модалки отмены заказа:
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  //Состояние для модалки подтверждения заказа:
  const [orderToConfirm, setOrderToConfirm] = useState<string | null>(null);

  //Мутации для подтверждения и отмены заказа:
  const completeOrderMutation = useCompleteOrder();
  const cancelOrderMutation = useCancelOrder();

  //Обработчик нажатия на кнопку получения заказа:
  const handleConfirmDelivery = () => {
    if (orderToConfirm) {
      completeOrderMutation.mutate(orderToConfirm);
      setOrderToConfirm(null);
    }
  };

  //Обработчик нажатия на кнопку отмены заказа:
  const handleConfirmCancel = () => {
    if (orderToCancel) {
      cancelOrderMutation.mutate(orderToCancel);
      setOrderToCancel(null);
    }
  };

  const translatedStatus = orderStatusTranslations[order.status as keyof typeof orderStatusTranslations] || "Неизвестный статус";

  return (
    <article className={styles.orderCard}>
      {/*Хэдер*/}
      <div className={styles.topBar}>
        Заказ №{String(order.orderNumber).padStart(6, "0")} от{" "}
        {new Date(order.createdAt).toLocaleDateString()}
      </div>

      <div className={styles.mainContent}>
        {/*Левая панель:*/}
        <div className={styles.leftPanel}>
          <div className={`${(isCanceled || isCompleted || isDelivery) ? styles.leftPanelWrapperStatusSolo : styles.leftPanelWrapperStatus}`}>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Сумма заказа:</span>
              <span className={styles.value}>
                {order.totalPrice.toLocaleString()} ₽
              </span>
            </div>

            <div className={styles.infoGroup}>
              <span className={styles.label}>Статус заказа:</span>
              <span
                className={`${styles.status} ${styles[order.status.toLowerCase()]}`}
              >
                {translatedStatus}
              </span>
            </div>
          </div>

          {(!isCanceled && !isCompleted && !isDelivery) && <div className={styles.leftPanelWrapper}>
            {/*Если заказ ожидает оплаты и есть ссылка на оплату — показываем кнопку оплаты: */}
            {order.status === "PENDING" && order.paymentUrl && (
              <Button
                type="button"
                variant="success"
                onClick={() => setIsModalOpen(true)}
                bold
              >
                Оплатить заказ
              </Button>
            )}

            {/*Кнопка подтверждения получения заказа (когда товар доставлен):*/}
            {isDelivered && (
              <Button
                type="button"
                variant="success"
                onClick={() => setOrderToConfirm(order.id)}
              >
                Подтвердить получение
              </Button>
            )}
            {/*Кнопка отмены заказа:*/}
            {canCancel && (
              <Button
                type="button"
                variant="cancel"
                onClick={() => setOrderToCancel(order.id)}
              >
                Отменить заказ
              </Button>
            )}
          </div>}
        </div>

        {/*Правая панель (товары):*/}
        <div className={styles.itemsList}>
          {order.items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={item}
              orderAddress={order.address}
              action={
                <LeaveReviewButton
                  orderId={order.id}
                  item={item}
                  isCompleted={isCompleted}
                />
              }
            />
          ))}
        </div>
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          window.open(order.paymentUrl, "_blank");
        }}
        totalPrice={order.totalPrice}
        items={order.items}
        createdAt={order.createdAt}
      />

      {/*Модалка отмены заказа:*/}
      <ActionConfirmModal
        isOpen={!!orderToCancel}
        variant="danger"
        title="Подтверждение отмены"
        description="Вы действительно хотите отменить этот заказ?"
        onConfirm={handleConfirmCancel}
        onCancel={() => setOrderToCancel(null)}
      />

      {/*Модалка подтверждения получения заказа:*/}
      <ActionConfirmModal
        isOpen={!!orderToConfirm}
        variant="success"
        title="Подтверждение завершения"
        description="Вы забрали свой заказ и подтверждаете его успешное завершение?"
        onConfirm={handleConfirmDelivery}
        onCancel={() => setOrderToConfirm(null)}
      />
    </article>
  );
};
