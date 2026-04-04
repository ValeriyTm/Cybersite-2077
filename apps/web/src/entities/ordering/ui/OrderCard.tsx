import styles from "./OrderCard.module.scss";

export const OrderCard = ({ order }: { order: any }) => {
  const isDelivered = order.status === "DELIVERED";
  const isCompleted = order.status === "COMPLETED";

  return (
    <div className={styles.orderCard}>
      {/* ШАПКА */}
      <div className={styles.topBar}>
        Заказ №{String(order.orderNumber).padStart(6, "0")} от{" "}
        {new Date(order.createdAt).toLocaleDateString()}
      </div>

      <div className={styles.mainContent}>
        {/* ЛЕВАЯ ПАНЕЛЬ */}
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
              {order.status}
            </span>
          </div>

          {/* Кнопка подтверждения */}
          {isDelivered && (
            <button
              className={styles.confirmBtn}
              onClick={() => handleConfirm(order.id)}
            >
              Подтвердить получение
            </button>
          )}
        </div>

        {/* СПИСОК ТОВАРОВ (СПРАВА) */}
        <div className={styles.itemsList}>
          {order.items.map((item: any) => (
            <div key={item.id} className={styles.productRow}>
              <div className={styles.imageWrapper}>
                <img
                  src={item.motorcycle.mainImage}
                  alt={item.motorcycle.model}
                />
                <span className={styles.quantityBadge}>{item.quantity}</span>
              </div>

              <div className={styles.productInfo}>
                <h4>{item.motorcycle.model}</h4>
                <p>
                  Артикул: <span>{item.motorcycle.slug}</span>
                </p>
                <p>
                  Адрес доставки: <span>{order.address}</span>
                </p>
              </div>

              {/* Кнопка отзыва */}
              {isCompleted && (
                <button className={styles.reviewBtn}>Оставить отзыв</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
