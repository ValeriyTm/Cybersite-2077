import { Link } from "react-router";
//API:
import { API_URL } from "@/shared/api";
//Компоненты:
import { Button } from "@/shared/ui";
//Типы:
import type { OrderItem } from "@/entities/ordering/types/types";
//Изображения:
import defaultMotoImage from '@/shared/assets/images/defaults/default-card-icon.jpg';
//Стили:
import styles from "./OrderItemRow.module.scss";

interface OrderItemRowProps {
  item: OrderItem;
  orderAddress: string;
  isCompleted: boolean;
  onOpenReviewModal: (item: OrderItem) => void;
}

export const OrderItemRow = ({ item, orderAddress, isCompleted, onOpenReviewModal }: OrderItemRowProps) => {
  const imageUrl = item.motorcycle.images?.length > 0
    ? `${API_URL}/static/motorcycles/${item.motorcycle.images.find((img) => img.isMain)?.url}`
    : defaultMotoImage;

  return (
    <div className={styles.productRow}>
      <div className={styles.imageWrapper}>
        <img src={imageUrl} loading="lazy" decoding="async" alt={item.motorcycle.model} width='90' height='90' />
        <span className={styles.quantityBadge}>{item.quantity} шт</span>
      </div>

      <div className={styles.productInfo}>
        <Link to={`../catalog/motorcycles/${item.motorcycle.brand.name}/${item.motorcycle.slug}`}>
          <h4>{item.motorcycle.model}</h4>
        </Link>
        <p>Артикул: <span>{item.motorcycle.slug}</span></p>
        <p>Адрес доставки: <span>{orderAddress}</span></p>
      </div>

      {isCompleted && (
        <Button
          type="button"
          variant="review"
          disabled={item.isReviewed}
          onClick={() => !item.isReviewed && onOpenReviewModal(item)}
          bold
        >
          {item.isReviewed ? "Отзыв оставлен ✓" : "Оставить отзыв"}
        </Button>
      )}
    </div>
  );
};
