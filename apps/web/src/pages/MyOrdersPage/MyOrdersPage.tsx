import { useQuery } from "@tanstack/react-query";
import styles from "./MyOrdersPage.module.scss";
import { $api } from "@/shared/api/api";
import { OrderCard } from "@/entities/ordering/ui/OrderCard";

export const MyOrdersPage = () => {
  const {
    data: orders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => $api.get("/orders/my").then((res) => res.data),

    //Добавляем автоматический опрос сервера каждые 30 секунд (чтобы статус был актуальным):
    refetchInterval: 30 * 1000,
    // Также обновлять, когда окно браузера снова становится активным:
    refetchOnWindowFocus: true,
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
