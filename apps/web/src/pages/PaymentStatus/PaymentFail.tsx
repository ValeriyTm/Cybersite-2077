import { Link } from "react-router";
import styles from "./PaymentStatus.module.scss";

export const PaymentFail = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>❌</div>
        <h1>Ошибка оплаты</h1>
        <p>
          Что-то пошло не так. Деньги не были списаны. Попробуйте оплатить заказ
          снова из личного кабинета.
        </p>
        <Link to="/profile/orders" className={styles.btn}>
          Вернуться к заказам
        </Link>
      </div>
    </div>
  );
};
