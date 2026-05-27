//Компоненты:
import { Button } from "@/shared/ui";
//Типы:
import type { MotorcycleCart } from "@/entities/catalog";
//Стили:
import styles from "./CheckoutSummary.module.scss";

interface CheckoutSummaryProps {
  items: MotorcycleCart[];
  deliveryInfo: any;
  promoFromCart?: string;
  finalOrderPrice: number;
  itemsTotal: number;
  isPending: boolean;
  onCreateOrder: (shouldPay: boolean) => void;
  onOpenPaymentModal: () => void;
}

export const CheckoutSummary = ({
  items,
  deliveryInfo,
  promoFromCart,
  finalOrderPrice,
  itemsTotal,
  isPending,
  onCreateOrder,
  onOpenPaymentModal,
}: CheckoutSummaryProps) => {
  return (
    <aside className={styles.summary}>
      <h3>Ваш заказ</h3>
      <div className={styles.row}>
        <span>Товары ({items.length}):</span>
        <span>+ {itemsTotal.toLocaleString()} ₽</span>
      </div>
      <div className={styles.row}>
        <span>Доставка:</span>
        <span>
          {deliveryInfo ? `+ ${deliveryInfo.cost.toLocaleString()} ₽` : "Выберите адрес"}
        </span>
      </div>
      <div className={styles.row}>
        <span>Промокод:</span>
        <span>
          {promoFromCart?.amount ? `- ${promoFromCart?.amount.toLocaleString()} ₽` : "Не применен"}
        </span>
      </div>
      <div className={`${styles.row} ${styles.total}`}>
        <span>К оплате:</span>
        <span>{finalOrderPrice.toLocaleString()} ₽</span>
      </div>

      <div className={styles.btnGroup}>
        <div className={styles.btnWrapper}>
          <Button
            type="button"
            variant="outline-dark"
            disabled={!deliveryInfo || isPending}
            onClick={() => onCreateOrder(false)}
            isLoading={isPending}
            loadingText="Оформление..."
          >
            Создать заказ без оплаты
          </Button>
        </div>

        <div className={styles.btnWrapper}>
          <Button
            type="button"
            variant="primary"
            disabled={!deliveryInfo || isPending}
            onClick={onOpenPaymentModal}
            isLoading={isPending}
            loadingText="Оформление..."
          >
            Создать заказ и оплатить
          </Button>
        </div>
      </div>
    </aside>
  );
};
