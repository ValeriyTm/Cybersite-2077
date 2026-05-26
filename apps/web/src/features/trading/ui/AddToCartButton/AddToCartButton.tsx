//Состояния:
import { useTradingStore, useCart } from "@/entities/trading/";
//Стили:
import styles from "./AddToCartButton.module.scss";

export interface AddToCartButtonProps {
  variant?: "card" | "details";
  data: {
    id: string,
    model: string,
    price: number,
    image?: string, //Не передаем, если вызываем со старницы корзины
    brandSlug?: string, //Не передаем, если вызываем со старницы корзины
    slug: string,
    totalInStock: number,
    year: number,
  };
  onCartPage?: boolean;
}

export const AddToCartButton = ({
  data,
  variant = "details",
  onCartPage = false,
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

  //Яндекс метрика:
  const handleOrder = () => {
    const metricaId = import.meta.env.VITE_YANDEX_METRICA_ID;

    if (typeof window !== 'undefined' && (window as any).ym) {
      (window as any).ym(metricaId, 'reachGoal', 'CLICK-CART');
    }
  };

  //1) Если товара нет в корзине, то показываем кнопку "В корзину"
  if (!cartItem) {
    return (
      <button
        disabled={!data.totalInStock} //Если товара нет в наличии, кнопка будет неактивной
        className={styles.addBtn}
        onClick={(e) =>
          handleAction(e, () => addToCart({ ...data, image: data.image!, brandSlug: data.brandSlug!, quantity: 1, selected: true }))
        }
      >
        {data.totalInStock ? "🛒 В корзину" : "Нет в наличии"}
      </button>
    );
  }

  //Если мы на странице корзины, то уменьшение товара меньше 1 невозможно (для этого отдельная кнопка):
  const handleDecrease = () => {
    if (cartItem!.quantity > 1) {
      updateQuantity({ id: data.id, quantity: cartItem!.quantity - 1 });
    } else {
      // Если остался 1 товар: в корзине зануляем, в каталоге — удаляем совсем
      if (onCartPage) {
        updateQuantity({ id: data.id, quantity: 0 });
      } else {
        removeItem(data.id);
      }
    }
  };

  const isMaxStockReached = cartItem!.quantity >= data.totalInStock;


  //2) Если товар есть в корзине, то показываем счетчик:
  return (
    <div className={styles.wrapper} onClick={(e) => e.preventDefault()}>
      <div className={styles.stepper}>
        {/*Кнопка уменьшения количества товара в корзине:*/}
        <button
          onClick={(e) =>
            handleAction(e, handleDecrease)
          }
          className={styles.quantityBtn}
        >
          -
        </button>

        {/*Счетчик количества товара в корзине:*/}
        <span className={styles.count}>{cartItem.quantity}</span>

        {/*Кнопка увеличения количества товара в корзине:*/}
        <button
          disabled={isMaxStockReached}
          onClick={(e) => {
            handleOrder();
            handleAction(e, () =>
              updateQuantity({ id: data.id, quantity: cartItem.quantity + 1 }),
            )
          }
          }
          className={styles.quantityBtn}
        >
          +
        </button>
      </div>

      {/*Отображаем текст "В корзине", если формат card и мы не на странице корзины:*/}
      {(variant === "card" && !onCartPage) && <div className={styles.addedBadge}>В корзине</div>}
    </div>
  );
};
