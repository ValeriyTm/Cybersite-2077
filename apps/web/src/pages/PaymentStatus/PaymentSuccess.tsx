import { Link } from "react-router";
import styles from "./PaymentStatus.module.scss";

export const PaymentSuccess = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>
        <h1>Оплата прошла успешно!</h1>
        <p>
          Ваш мотоцикл уже готовится к отправке. Мы пришлем уведомление, когда
          статус изменится.
        </p>
        <Link to="/profile/orders" className={styles.btn}>
          В мои заказы
        </Link>
      </div>
    </div>
  );
};
