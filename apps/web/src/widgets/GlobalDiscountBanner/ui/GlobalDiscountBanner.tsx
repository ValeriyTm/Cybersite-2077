import { useGlobalDiscount } from "@/entities/discount";
//Компоненты:
import { BannerTimer } from "./components/BannerTimer";
//Стили
import styles from "./GlobalDiscountBanner.module.scss";

export const GlobalDiscountBanner = () => {

  //Данные по глобальной скидке:
  const { data: discount } = useGlobalDiscount();

  if (!discount) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.info}>
            <h3 className={styles.discountTitle}>🔥 День {discount.year} года!</h3>
            <p>
              Скидка <strong>-{discount.percent}%</strong> на все модели этого
              года
            </p>
          </div>

          {/*Таймер обратного отсчёта: */}
          <BannerTimer />
        </div>
      </div>
    </div>
  );
};
