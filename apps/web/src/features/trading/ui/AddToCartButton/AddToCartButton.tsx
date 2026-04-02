import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useCart } from "@/entities/trading/api/useCart";
import styles from "./AddToCartButton.module.scss";

export interface AddToCartButtonProps {
  motorcycle: any; // Тот самый объект с model, price, image и т.д.
  variant?: "card" | "favorite"; // Разные стили для двух твоих макетов
}

export const AddToCartButton = ({
  data,
  variant = "details",
}: AddToCartButtonProps) => {
  const { addToCart, updateQuantity, removeItem } = useCart();

  // Ищем, есть ли этот конкретный мотоцикл в корзине (Zustand)
  const cartItem = useTradingStore((state) =>
    state.cartItems.find((i) => i.id === data.id),
  );

  //Обертка для остановки всплытия
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault(); // Останавливает переход по ссылке
    e.stopPropagation(); // Останавливает передачу клика родителю (<Link>)
    action();
  };

  // 1. Если товара НЕТ в корзине — показываем синюю кнопку "В корзину"
  if (!cartItem) {
    return (
      <button
        className={styles.addBtn}
        onClick={(e) =>
          handleAction(e, () => addToCart({ ...data, quantity: 1 }))
        }
      >
        🛒 В корзину
      </button>
    );
  }

  // 2. Если товар ЕСТЬ в корзине — показываем счетчик и бейдж (если это карточка)
  return (
    <div className={styles.wrapper} onClick={(e) => e.preventDefault()}>
      {variant === "card" && <div className={styles.addedBadge}>В корзине</div>}

      <div className={styles.stepper}>
        <button
          onClick={(e) =>
            handleAction(e, () => {
              if (cartItem.quantity > 1) {
                updateQuantity({
                  id: data.id,
                  quantity: cartItem.quantity - 1,
                });
              } else {
                removeItem(data.id);
              }
            })
          }
        >
          -
        </button>

        <span className={styles.count}>{cartItem.quantity}</span>

        <button
          onClick={(e) =>
            handleAction(e, () =>
              updateQuantity({ id: data.id, quantity: cartItem.quantity + 1 }),
            )
          }
        >
          +
        </button>
      </div>
    </div>
  );
};
