import { useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import styles from "./GlobalDiscountBanner.module.scss";

export const GlobalDiscountBanner = () => {
  const { data: discount, isLoading } = useQuery({
    queryKey: ["global-discount"],
    queryFn: () => $api.get("/discount/global").then((res) => res.data),
    staleTime: 1000 * 60 * 60, // Данные меняются раз в день, кэшируем на час
  });

  if (isLoading || !discount) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>🔥</span>
        <div className={styles.text}>
          <h3>День {discount.year} года выпуска!</h3>
          <p>
            Сегодня на все модели этого года действует скидка{" "}
            <strong>-{discount.percent}%</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
