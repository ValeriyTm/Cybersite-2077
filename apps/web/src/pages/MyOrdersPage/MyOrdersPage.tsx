import { useQuery } from "@tanstack/react-query";
import styles from "./MyOrdersPage.module.scss";
import { $api } from "@/shared/api/api";
import { OrderCard } from "@/entities/ordering/ui/OrderCard";

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

//Новая:
export const MyOrdersPage = () => {
  const {
    data: orders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => $api.get("/orders/my").then((res) => res.data),
  });

  if (isLoading) {
    return <div className={styles.loading}>Загрузка ваших заказов... 🏍️</div>;
  }

  if (isError) {
    return (
      <div className={styles.error}>
        Ошибка при загрузке заказов. Попробуйте позже.
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Мои заказы</h1>

      <div className={styles.list}>
        {orders && orders.length > 0 ? (
          orders.map((order: any) => <OrderCard key={order.id} order={order} />)
        ) : (
          <div className={styles.empty}>
            <p>У вас пока нет оформленных заказов.</p>
          </div>
        )}
      </div>
    </main>
  );
};
