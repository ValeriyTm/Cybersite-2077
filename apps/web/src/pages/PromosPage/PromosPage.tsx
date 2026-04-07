import { useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import toast from "react-hot-toast";
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

  if (isLoading) return <div className={styles.loader}>Загрузка акций...</div>;

  return (
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
  );
};
