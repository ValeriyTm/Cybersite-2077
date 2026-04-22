import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { getTimeToMidnight } from "@/shared/lib/utils/timeToMidnight";
import styles from "./GlobalDiscountBanner.module.scss";

export const GlobalDiscountBanner = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeToMidnight());

  // Запускаем тиканье таймера
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getTimeToMidnight();
      setTimeLeft(newTime);

      // Если время вышло, можно обновить данные (рефетч)
      if (newTime.totalMs <= 0) {
        window.location.reload(); // Или queryClient.invalidateQueries
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { data: discount } = useQuery({
    queryKey: ["global-discount"],
    queryFn: () => $api.get("/discount/global").then((res) => res.data),
  });

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
          <div className={styles.timer} role='time'>
            <span className={styles.timerLabel}>До конца акции:</span>
            <div className={styles.digits}>
              <span>{timeLeft.hours}</span>:<span>{timeLeft.minutes}</span>:
              <span>{timeLeft.seconds}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
