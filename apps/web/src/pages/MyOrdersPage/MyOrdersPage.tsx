//Состояния:
import { useState } from "react";
import { useAuthStore } from "@/features/auth";
import { useMyOrders } from "@/entities/ordering";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { OrderCard } from "@/widgets/OrderCard";
import { SelectFilter } from "@/features/catalog";
//Прочее:
import { statusOptions } from "./categories";
//Стили:
import styles from "./MyOrdersPage.module.scss";


export const MyOrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const { isAuth } = useAuthStore();

  //Получаем список заказов юзера:
  const { data: orders, isLoading, isError } = useMyOrders(statusFilter);

  if (!isAuth) {
    return (
      <div className={`${styles.infoState} ${styles.notAuth}`}>
        Вы не авторизованы 🔑
      </div>
    );
  }
  if (isLoading) {
    return <div className={`${styles.infoState} ${styles.loading}`}>Загрузка ваших заказов... 🏍️</div>;
  }

  if (isError) {
    return (
      <div className={`${styles.infoState} ${styles.error}`}>
        Ошибка при загрузке заказов. Попробуйте позже.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Мои заказы</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className={styles.container}>
        <h1 className={styles.title}>Мои заказы</h1>

        <SelectFilter
          label="Фильтр по статусу"
          value={statusFilter}
          options={statusOptions}
          onChange={setStatusFilter}
          placeholder="Все заказы"
        />

        <div className={styles.list}>
          {orders && orders.length > 0 ? (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          ) : (
            <div className={styles.empty}>
              <p>У вас пока нет оформленных заказов.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};
