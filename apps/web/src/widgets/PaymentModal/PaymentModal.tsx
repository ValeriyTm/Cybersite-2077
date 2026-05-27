//Типы:
import type { MotorcycleCart } from "@/entities/catalog";
import type { OrderItem } from "@/entities/ordering/types/types";
//Компоненты:
import { Button, PaymentTimer } from "@/shared/ui";
//Изображения:
import yookassaLogo from '@/shared/assets/images/logos/yookassa_logo.png'
//Стили:
import styles from "./PaymentModal.module.scss";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalPrice: number;
  items: MotorcycleCart[] | OrderItem[];
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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className="visually-hidden">Оплата заказа</h2>
        <h3>Выбор способа оплаты</h3>

        <div className={styles.methodList}>
          <div className={`${styles.methodItem} ${styles.active}`}>
            <img
              src={yookassaLogo}
              alt="ЮKassa"
              width='215'
              height='85'
            />
          </div>
        </div>

        <div className={styles.details}>
          <p>
            Сумма к оплате: <strong>{totalPrice.toLocaleString()} ₽</strong>
          </p>
          {createdAt && (
            <p>
              Осталось времени на оплату: <PaymentTimer createdAt={createdAt} />
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
            {items.map((item, i) => {
              const motoModel = 'motorcycle' in item
                ? item.motorcycle?.model
                : item.model;

              return (
                <li key={i}>
                  {motoModel}{" "}
                  <span>{item.quantity} шт</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className={styles.btnGroup}>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
          >
            Оплатить
          </Button>
          <Button
            type="button"
            variant="simple"
            onClick={onClose}
          >
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
};
