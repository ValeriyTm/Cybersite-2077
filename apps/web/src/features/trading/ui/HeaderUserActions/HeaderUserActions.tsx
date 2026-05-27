import { useMemo } from "react";
import { useTradingStore } from "@/entities/trading";
import { useOrderStore } from "@/entities/ordering";
//Навигация:
import { Link } from "react-router";
//Стили:
import styles from "./HeaderUserActions.module.scss";

export const HeaderUserActions = () => {
  const favoritesCount = useTradingStore((state) => state.favoritesCount);
  const cartItems = useTradingStore((state) => state.cartItems);
  const activeOrdersCount = useOrderStore((state) => state.activeOrdersCount);

  //Количество товаров в корзине:
  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  return (
    <div className={styles.userOrders}>
      {/* Кнопка избранного */}
      <Link to="/profile/favorites" className={styles.iconBtn} title="Избранное">
        ❤️ {favoritesCount > 0 && <span className={styles.counter}>{favoritesCount}</span>}
      </Link>

      {/* Кнопка корзины */}
      <Link to="/cart" title="Корзина" className={styles.iconBtn}>
        🛒 {cartCount > 0 && <span className={styles.counter}>{cartCount}</span>}
      </Link>

      {/* Кнопка заказов */}
      <Link to="/orders/my" className={styles.iconBtn} title="Мои заказы">
        📦 {activeOrdersCount > 0 && <span className={styles.counter}>{activeOrdersCount}</span>}
      </Link>
    </div>
  );
};
