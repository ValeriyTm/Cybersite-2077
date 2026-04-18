
import { createPortal } from "react-dom";
//Состояния:
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrderStore } from "../model/orderStore"; //Состояние активных заказов
//Навигация:
import { Link } from "react-router";
//API:
import { $api, API_URL } from "@/shared/api/api";
//Компоненты:
import { ReviewModal } from "@/features/reviews/ui/ReviewModal/ReviewModal";
import { PaymentModal } from "@/shared/ui/PaymentModal/PaymentModal";
//Стили:
import styles from "./OrderCard.module.scss";

export const OrderCard = ({ order }: { order: any }) => {
  //Определяем статус заказа:
  const isDelivered = order.status === "DELIVERED";
  const isCompleted = order.status === "COMPLETED";
  const canCancel = ["PENDING", "PAID", "DELIVERY"].includes(order.status);
  //Для реализации открытия модалки отзыва:
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  //Состояние для pre-payment модалки:
  const [isModalOpen, setIsModalOpen] = useState(false);
  //Состояние для модалки отмены заказа:
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

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

  //Обработчик нажатия на кнопку завершения заказа:
  const handleConfirm = (id: string) => {
    if (window.confirm("Вы получили товар и хотите завершить заказ?")) {
      //Запускаем отправку данных на сервер:
      completeMutation.mutate(id);
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
  const handleCancel = (id: string) => {
    if (confirm('Вы точно хотите отменить заказ?')) {
      cancelMutation.mutate(id);
    }
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      cancelMutation.mutate(orderToCancel);
      setOrderToCancel(null);
    }
  };


  //---------------Оставляем отзыв на заказ:-------------------------------//
  //Для реализации модалки отзыва:
  const handleOpenReview = (item: any) => {
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
  const translatedStatus = orderStatusTranslations[order.status] || "Неизвестный статус";

  return (
    <div className={styles.orderCard}>
      {/*Хэдер*/}
      <div className={styles.topBar}>
        Заказ №{String(order.orderNumber).padStart(6, "0")} от{" "}
        {new Date(order.createdAt).toLocaleDateString()}
      </div>

      <div className={styles.mainContent}>
        {/*Левая панель:*/}
        <div className={styles.leftPanel}>
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

          {/*Если заказ ожидает оплаты и есть ссылка на оплату — показываем кнопку оплаты: */}
          {order.status === "PENDING" && order.paymentUrl && (
            <button
              className={styles.confirmBtn}
              onClick={() => setIsModalOpen(true)}
            >
              Оплатить заказ
            </button>
          )}

          {/*Кнопка подтверждения получения заказа (когда товар доставлен):*/}
          {isDelivered && (
            <button
              className={styles.confirmBtn}
              onClick={() => handleConfirm(order.id)}
            >
              Подтвердить получение
            </button>
          )}
          {/*Кнопка отмены заказа:*/}
          {canCancel && (
            // <button
            //   className={styles.cancelBtn}
            //   onClick={() => handleCancel(order.id)}

            // >
            //   Отменить заказ
            // </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setOrderToCancel(order.id)}
            >
              Отменить заказ
            </button>
          )}
        </div>

        {/*Правая панель (товары):*/}
        <div className={styles.itemsList}>
          {order.items.map((item: any) => {
            const imageUrl = item.motorcycle.images?.[0]
              ? `${API_URL}/static/motorcycles/${item.motorcycle.images?.[0]?.url}`
              : `${API_URL}/static/defaults/default-card-icon.jpg`;

            return (
              <div key={item.id} className={styles.productRow}>
                <div className={styles.imageWrapper}>
                  <img src={imageUrl} alt={item.motorcycle.model} />
                  <span className={styles.quantityBadge}>
                    {item.quantity} шт
                  </span>
                </div>

                <div className={styles.productInfo}>
                  <Link
                    to={`../catalog/motorcycles/${item.motorcycle.brand.name}/${item.motorcycle.slug}`}
                  >
                    <h4>{item.motorcycle.model}</h4>
                  </Link>
                  <p>
                    Артикул: <span>{item.motorcycle.slug}</span>
                  </p>
                  <p>
                    Адрес доставки: <span>{order.address}</span>
                  </p>
                </div>

                {/*Кнопка отзыва (вызова модалки отзыва):*/}
                {isCompleted && (
                  <button
                    className={
                      item.isReviewed ? styles.reviewedBtn : styles.reviewBtn
                    }
                    disabled={item.isReviewed}
                    onClick={() => !item.isReviewed && handleOpenReview(item)}
                  >
                    {item.isReviewed ? "Отзыв оставлен ✓" : "Оставить отзыв"}
                  </button>
                )}

                {/*Модалка отзыва:*/}
                {isReviewModalOpen && selectedItem && (
                  <ReviewModal
                    orderId={order.id}
                    item={selectedItem}
                    onClose={() => setIsReviewModalOpen(false)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          // window.location.href = order.paymentUrl;
          window.open(order.paymentUrl, "_blank");
        }}
        totalPrice={order.totalPrice}
        items={order.items}
        createdAt={order.createdAt}
      />


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


    </div>
  );
};
