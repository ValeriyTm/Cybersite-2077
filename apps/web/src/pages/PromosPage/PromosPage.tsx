//Состояния:
import { useQuery } from "@tanstack/react-query";
//API:
import { API_URL, $api } from "@/shared/api/api";
//SEO:
import { Helmet } from "react-helmet-async";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from "./PromosPage.module.scss";

export const PromosPage = () => {
  const { data: promos, isLoading } = useQuery({
    queryKey: ["all-promos"],
    queryFn: () => $api.get("/discount/all-promos").then((res) => res.data),
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Промокод ${code} скопирован!`);
  };

  //SEO:
  const canonicalUrl = `${API_URL}/promos`;

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

        <div className={styles.grid}>
          {promos?.map((promo: any) => (
            <div key={promo.id} className={styles.promoCard}>
              <div className={styles.amount}>
                -{promo.discountAmount.toLocaleString()} ₽
              </div>
              <div className={styles.codeWrap}>
                <span className={styles.code}>{promo.code}</span>
                <button onClick={() => copyToClipboard(promo.code)}>
                  Копировать
                </button>
              </div>
              <div className={styles.expires}>
                Действует до: {new Date(promo.expiresAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>

  );
};
