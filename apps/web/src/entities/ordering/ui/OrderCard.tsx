import { useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "./OrderCard.module.scss";
import { $api } from "@/shared/api/api";
import { useOrderStore } from "../model/orderStore";
import { Link } from "react-router";

export const OrderCard = ({ order }: { order: any }) => {
  const isDelivered = order.status === "DELIVERED";
  const isCompleted = order.status === "COMPLETED";
  const canCancel = ["PENDING", "PAID", "DELIVERY"].includes(order.status);

  const { fetchActiveCount } = useOrderStore();

  const queryClient = useQueryClient(); //Необходимо для мутаций

  const completeMutation = useMutation({
    mutationFn: (orderId: string) =>
      $api.patch(`/orders/${orderId}/complete`).then((res) => res.data),
    onSuccess: () => {
      //Обновляем список заказов на странице:
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      //Обновляем счетчик активных заказов в Хедере:
      fetchActiveCount();
    },
  });

  const handleConfirm = (id: string) => {
    if (window.confirm("Вы получили товар и хотите завершить заказ?")) {
      completeMutation.mutate(id);
    }
  };

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) =>
      $api.patch(`/orders/${orderId}/cancel`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      fetchActiveCount();
    },
  });

  const handleCancel = (id: string) => {
    if (
      window.confirm(
        "Вы уверены, что хотите отменить заказ? Товары вернутся на склад.",
      )
    ) {
      cancelMutation.mutate(id);
    }
  };

  let translatedStatus;
  switch (order.status) {
    case "PENDING":
      translatedStatus = "Ожидает оплаты";
      break;
    case "CANCELED":
      translatedStatus = "Отменен";
      break;
    case "PAID":
      translatedStatus = "Передача в доставку";
      break;
    case "DELIVERY":
      translatedStatus = "Осуществляется доставка";
      break;
    case "DELIVERED":
      translatedStatus = "Можете забирать";
      break;
    case "COMPLETED":
      translatedStatus = "Завершен";
      break;
  }

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

          {/*Кнопка подтверждения получения заказа*/}
          {isDelivered && (
            <button
              className={styles.confirmBtn}
              onClick={() => handleConfirm(order.id)}
            >
              Подтвердить получение
            </button>
          )}
          {/*Кнопка отмены заказа*/}
          {canCancel && (
            <button
              className={styles.cancelBtn}
              onClick={() => handleCancel(order.id)}
            >
              Отменить заказ
            </button>
          )}
        </div>

        {/*Правая панель (товары):*/}
        <div className={styles.itemsList}>
          {order.items.map((item: any) => {
            const imageUrl = item.motorcycle.images?.[0]
              ? `http://localhost:3001/static/motorcycles/${item.motorcycle.images?.[0]?.url}`
              : "http://localhost:3001/static/defaults/default-card-icon.jpg";

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

                {/*Кнопка отзыва:*/}
                {isCompleted && (
                  <button className={styles.reviewBtn}>Оставить отзыв</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
