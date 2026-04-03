import { useQuery } from "@tanstack/react-query";
import styles from "./MyOrdersPage.module.scss";
import { $api } from "@/shared/api/api";

export const MyOrdersPage = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => $api.get("/orders/my").then((res) => res.data),
  });

  if (isLoading) return <div>Загрузка заказов...</div>;

  return (
    <main className={styles.container}>
      <h1>Мои заказы</h1>
      <div className={styles.list}>
        {orders?.map((order: any) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.header}>
              <span className={styles.orderId}>
                Заказ №{String(order.orderNumber).padStart(6, "0")}
                {/* Результат: Заказ №001024 */}
              </span>
              <span className={styles.date}>
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
              <span
                className={`${styles.status} ${styles[order.status.toLowerCase()]}`}
              >
                {order.status}
              </span>
            </div>
            <div className={styles.details}>
              <p>Адрес доставки: {order.address}</p>
              <p>
                Итого: <strong>{order.totalPrice.toLocaleString()} ₽</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
