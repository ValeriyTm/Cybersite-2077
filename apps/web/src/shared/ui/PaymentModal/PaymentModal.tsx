import { useEffect, useState } from "react";
import styles from "./PaymentModal.module.scss";
import { API_URL } from "@/shared/api/api";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalPrice: number;
  items: any[];
  createdAt?: string; // Передаем только для уже созданных заказов
}

export const PaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalPrice,
  items,
  createdAt,
}: PaymentModalProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!createdAt) return;

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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Выбор способа оплаты</h3>

        <div className={styles.methodList}>
          <div className={`${styles.methodItem} ${styles.active}`}>
            <img
              src={`src/shared/assets/images/logos/yookassa_logo.png`}
              alt="ЮKassa"
            />
          </div>
        </div>

        <div className={styles.details}>
          <p>
            Сумма к оплате: <strong>{totalPrice.toLocaleString()} ₽</strong>
          </p>
          {createdAt && (
            <p>
              Осталось времени на оплату:{" "}
              <span className={styles.timer}>{timeLeft}</span>
            </p>
          )}
          <p>
            -Для успешной оплаты введите номер карты "4111 1111 1111 1111" с
            любым сроком действия и кодом.
          </p>

        </div>

        <div className={styles.orderSummary}>
          <h4>Состав заказа:</h4>
          <ul>
            {items.map((item, i) => (
              <li key={i}>
                {item.motorcycle?.model || item.model}{" "}
                <span>{item.quantity} шт</span>
              </li>
            ))}
          </ul>
        </div>

        <button className={styles.payBtn} onClick={onConfirm}>
          Оплатить
        </button>
        <button className={styles.closeBtn} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};
