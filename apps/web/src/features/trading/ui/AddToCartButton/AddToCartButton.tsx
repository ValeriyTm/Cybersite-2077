import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useCart } from "@/entities/trading/api/useCart";
import styles from "./AddToCartButton.module.scss";

export interface AddToCartButtonProps {
  motorcycle: any;
  variant?: "card" | "favorite";
}

export const AddToCartButton = ({
  data,
  variant = "details",
}: AddToCartButtonProps) => {
  const { addToCart, updateQuantity, removeItem } = useCart();

  //Ищем, есть ли этот конкретный мотоцикл в корзине:
  const cartItem = useTradingStore((state) =>
    state.cartItems.find((i) => i.id === data.id),
  );

  //Обертка для остановки всплытия
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault(); //Останавливает переход по ссылке
    e.stopPropagation(); //Останавливает передачу клика родителю (тег <Link>)
    action();
  };

  console.log("Данные в кнопку пришли:", data);

  //1) Если товара нет в корзине, то показываем кнопку "В корзину"
  if (!cartItem) {
    return (
      <button
        disabled={!data.totalInStock}
        className={styles.addBtn}
        onClick={(e) =>
          handleAction(e, () => addToCart({ ...data, quantity: 1 }))
        }
      >
        {data.totalInStock ? "🛒 В корзину" : "Нет в наличии"}
      </button>
    );
  }

  //2) Если товар есть в корзине, то показываем счетчик и бейдж (если это карточка):
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
