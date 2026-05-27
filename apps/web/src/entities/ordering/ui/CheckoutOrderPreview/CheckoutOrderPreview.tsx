//Типы:
import type { MotorcycleCart } from "@/entities/catalog";
//Стили:
import styles from "./CheckoutOrderPreview.module.scss";

interface CheckoutOrderPreviewProps {
  items: MotorcycleCart[];
}

export const CheckoutOrderPreview = ({ items }: CheckoutOrderPreviewProps) => {
  return (
    <section className={styles.section}>
      <h3>2. Состав заказа</h3>
      <div className={styles.previewList}>
        {items.map((item) => (
          <div key={item.id} className={styles.miniItem}>
            <span>
              {item.model} x {item.quantity} шт, {item.year} г
            </span>
            <span>
              {(item.discountData.finalPrice * item.quantity).toLocaleString()} ₽
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
