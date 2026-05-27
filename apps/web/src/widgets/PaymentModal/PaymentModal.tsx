import { FocusTrap } from "focus-trap-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
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
  //Блокировка скролла при открытии модалки:
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: onClose }}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog"
          aria-modal="true">
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
      </FocusTrap>
    </div>,
    document.getElementById("modals-root")!
  );
};
