//Состояния:
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
//API:
import { $api, API_URL } from "@/shared/api/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { OrderCard } from "@/entities/ordering/ui/OrderCard";
import { SelectFilter } from "@/features/catalog-filter/ui/SelectFilter/SelectFilter";
//Стили:
import styles from "./MyOrdersPage.module.scss";


export const MyOrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  const {
    data: orders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-orders", statusFilter],
    queryFn: () =>
      //Получаем список заказов юзера:
      $api
        .get("/orders/my", {
          params: { status: statusFilter },
        })
        .then((res) => res.data),

    //Добавляем автоматический опрос сервера каждые 30 секунд (чтобы статус был актуальным):
    refetchInterval: 30 * 1000,
    //Также обновлять, когда окно браузера снова становится активным:
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

  //Опции для фильтра по статусу заказа:
  const statusOptions = [
    { value: "PENDING", label: "Ожидают оплаты" },
    { value: "PAID", label: "Оплачены" },
    { value: "DELIVERY", label: "Доставляются" },
    { value: "DELIVERED", label: "Доставлены" },
    { value: "COMPLETED", label: "Завершены" },
    { value: "CANCELED", label: "Отменены" },
  ];

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
            orders.map((order: any) => <OrderCard key={order.id} order={order} />)
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
