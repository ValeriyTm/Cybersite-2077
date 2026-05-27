
import { createPortal } from "react-dom";
//Состояния:
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrderStore } from "@/entities/ordering/model"; //Состояние активных заказов
//Навигация:
import { Link } from "react-router";
//API:
import { $api, API_URL } from "@/shared/api";
//Компоненты:
import { ReviewModal } from "@/features/reviews";
import { PaymentModal } from "@/widgets/PaymentModal";
//Типы:
import type { Order, OrderItem } from "@/entities/ordering/types/types";
//Изображения:
import defaultMotoImage from '@/shared/assets/images/defaults/default-card-icon.jpg'
//Стили:
import styles from "./OrderCard.module.scss";
import { Button } from "@/shared/ui";
import { OrderItemRow } from "@/entities/ordering";

export const OrderCard = ({ order }: { order: Order }) => {
  //Определяем статус заказа:
  const isDelivered = order.status === "DELIVERED";
  const isCompleted = order.status === "COMPLETED";
  const isCanceled = order.status === "CANCELED";
  const canCancel = ["PENDING", "PAID"].includes(order.status);
  //Для реализации открытия модалки отзыва:
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  //Состояние для pre-payment модалки:
  const [isModalOpen, setIsModalOpen] = useState(false);
  //Состояние для модалки отмены заказа:
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  //Состояние для модалки подтверждения заказа:
  const [orderToConfirm, setOrderToConfirm] = useState<string | null>(null);

  const { fetchActiveCount } = useOrderStore(); //Метод для получения кол-ва активных заказов

  const queryClient = useQueryClient(); //Необходимо для мутаций

  //---------------Завершение заказа-------------------------------//
  //Мутация завершения заказа (подтверждение получения товара):
  const completeMutation = useMutation({
    mutationFn: (orderId: string) =>
      $api.patch(`/orders/${orderId}/complete`).then((res) => res.data),
    onSuccess: () => {
      //Обнуляем старый кэш:
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      //Обновляем счетчик активных заказов в Хедере:
      fetchActiveCount();
    },
  });


  //Обработчик нажатия на кнопку получения заказа:
  const handleConfirmDelivery = () => {
    if (orderToConfirm) {
      completeMutation.mutate(orderToConfirm);
      setOrderToConfirm(null);
    }
  };

  //---------------Отмена заказа-------------------------------//
  const cancelMutation = useMutation({
    mutationFn: (orderId: string) =>
      $api.patch(`/orders/${orderId}/cancel`).then((res) => res.data),
    onSuccess: () => {
      //Обнуляем старый кэш:
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      //Обновляем счетчик активных заказов в Хедере:
      fetchActiveCount();
    },
  });

  //Обработчик нажатия на кнопку отмены заказа:
  const handleConfirmCancel = () => {
    if (orderToCancel) {
      cancelMutation.mutate(orderToCancel);
      setOrderToCancel(null);
    }
  };


  //---------------Оставляем отзыв на заказ:-------------------------------//
  //Для реализации модалки отзыва:
  const handleOpenReview = (item: OrderItem) => {

    setSelectedItem(item);
    setIsReviewModalOpen(true);
  };

  //---------------Прочее:-------------------------------//

  //Маппим статусы с рабочих названий на человекопонятные:
  const orderStatusTranslations = {
    PENDING: "Ожидает оплаты",
    CANCELED: "Отменен",
    PAID: "Передача в доставку",
    DELIVERY: "Осуществляется доставка",
    DELIVERED: "Можете забирать",
    COMPLETED: "Завершен",
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
          <div className={`${(isCanceled || isCompleted) ? styles.leftPanelWrapperStatusSolo : styles.leftPanelWrapperStatus}`}>
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

          {(!isCanceled && !isCompleted) && <div className={styles.leftPanelWrapper}>
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
              isCompleted={isCompleted}
              onOpenReviewModal={handleOpenReview}
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
      {orderToCancel && createPortal(
        <div className={styles.modalOverlay} onClick={() => setOrderToCancel(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Подтверждение</h3>
            <p className={styles.modalText}>
              Вы действительно хотите отменить заказ?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setOrderToCancel(null)}>
                Назад
              </button>
              <button className={styles.btnDanger} onClick={handleConfirmCancel}>
                Да
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('modals-root')! //Рендер через портал
      )}

      {/*Модалка подтверждения получения заказа:*/}
      {orderToConfirm && createPortal(
        <div className={styles.modalOverlay} onClick={() => setOrderToConfirm(null)}>
          <div className={styles.modalContentSuccess} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitleSuccess}>Подтверждение</h3>
            <p className={styles.modalText}>
              Вы забрали свой заказ и подтверждаете его завершение?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondarySuccess} onClick={() => setOrderToConfirm(null)}>
                Назад
              </button>
              <button className={styles.btnSuccess} onClick={handleConfirmDelivery}>
                Да
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('modals-root')! //Рендер через портал
      )}
    </article>
  );
};
