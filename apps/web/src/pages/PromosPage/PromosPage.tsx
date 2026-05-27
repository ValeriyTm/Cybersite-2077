//API:
import { API_URL } from "@/shared/api";
//SEO:
import { Helmet } from "react-helmet-async";
//Компоненты:
import { PromoCard, usePromos } from "@/entities/discount";
//Стили:
import styles from "./PromosPage.module.scss";

const canonicalUrl = `${API_URL}/promos`;

export const PromosPage = () => {
  //Получаем промокоды:
  const { data: promos, isLoading } = usePromos();


  if (isLoading) return <div className={styles.loader}>Загрузка акций...</div>;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Промокоды</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className={styles.container}>
        <h1 className={styles.title}>Актуальные промокоды</h1>
        <p className={styles.subtitle}>
          Используйте эти слова при оформлении заказа, чтобы получить скидку
        </p>


        {promos && promos.length > 0 ? (
          <div className={styles.grid}>
            {promos.map((promo) => (
              <PromoCard key={promo.code} promo={promo} />
            ))}
          </div>
        ) : (
          /*UX-заглушка на случай отсутствия акций: */
          <div className={styles.emptyState}>
            <p>На данный момент активных промокодов нет. Следите за обновлениями в наших новостях! 🏍️</p>
          </div>
        )}
      </div>

    </>
  );
};
