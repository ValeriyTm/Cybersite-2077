import { useEffect, useState } from "react";
//Стили:
import styles from "./PaymentTimer.module.scss";

interface PaymentTimerProps {
  createdAt: string;
}

export const PaymentTimer = ({ createdAt }: PaymentTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      const expiresAt = new Date(createdAt).getTime() + 60 * 60 * 1000; // +1 час
      const now = new Date().getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("Время истекло");
        clearInterval(timer);
      } else {
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  return <span className={styles.timer}>{timeLeft}</span>;
};
