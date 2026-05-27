import { useState, useEffect } from "react";
//Компоненты:
import { getTimeToMidnight } from "@/shared/lib";
//Стили:
import styles from "./BannerTimer.module.scss";

export const BannerTimer = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeToMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getTimeToMidnight();
      setTimeLeft(newTime);

      if (newTime.totalMs <= 0) {
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.timer} role="timer" aria-live="polite">
      <span className={styles.timerLabel}>До конца акции:</span>
      <div className={styles.digits}>
        <span>{timeLeft.hours}</span>:
        <span>{timeLeft.minutes}</span>:
        <span>{timeLeft.seconds}</span>
      </div>
    </div>
  );
};
