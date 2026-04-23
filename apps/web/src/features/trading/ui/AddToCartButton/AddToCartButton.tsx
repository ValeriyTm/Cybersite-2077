//Состояния:
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useCart } from "@/entities/trading/api/useCart";
//Стили:
import styles from "./AddToCartButton.module.scss";

export interface AddToCartButtonProps {
  motorcycle: any;
  variant?: "card" | "favorite";
}

export const AddToCartButton = ({
  data,
  variant = "details",
}: AddToCartButtonProps) => {
  //Мутации для работы с корзиной:
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

  //1) Если товара нет в корзине, то показываем кнопку "В корзину"
  if (!cartItem) {
    return (
      <button
        disabled={!data.totalInStock} //Если товара нет в наличии, кнопка будет неактивной
        className={styles.addBtn}
        onClick={(e) =>
          handleAction(e, () => addToCart({ ...data, quantity: 1 }))
        }
      >
        {data.totalInStock ? "🛒 В корзину" : "Нет в наличии"}
      </button>
    );
  }

  //2) Если товар есть в корзине, то показываем счетчик:
  return (
    <div className={styles.wrapper} onClick={(e) => e.preventDefault()}>
      <div className={styles.stepper}>
        {/*Кнопка уменьшения количества товара в корзине:*/}
        <button
          onClick={(e) =>
            handleAction(e, () => {
              //Если товара более 1 в корзине, то уменьшаем на "1". Если товара "1", то просто удаляем из корзины:
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
          className={styles.quantityBtn}
        >
          -
        </button>

        {/*Счетчик количества товара в корзине:*/}
        <span className={styles.count}>{cartItem.quantity}</span>

        {/*Кнопка увеличения количества товара в корзине:*/}
        <button
          onClick={(e) =>
            handleAction(e, () =>
              updateQuantity({ id: data.id, quantity: cartItem.quantity + 1 }),
            )
          }
          className={styles.quantityBtn}
        >
          +
        </button>
      </div>

      {/*Отображаем текст "В корзине", если формат card:*/}
      {variant === "card" && <div className={styles.addedBadge}>В корзине</div>}
    </div>
  );
};
