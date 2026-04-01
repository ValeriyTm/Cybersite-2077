import React from "react";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useCart } from "@/entities/trading/api/useCart";
import { useFavorites } from "@/entities/trading/api/useFavorites";
import { MotorcycleCard } from "@/entities/catalog/ui/MotorcycleCard/MotorcycleCard";
import styles from "./CartPage.module.scss";
import { ConfirmModal } from "@/shared/ui/ConfirmModal/ConfirmModal";
import { useState } from "react";

export const CartPage = () => {
  const { cartItems, toggleSelectItem, toggleSelectAll, updateItemQuantity } =
    useTradingStore();
  const { updateQuantity, removeItem, removeSelected } = useCart();

  const favoriteIds = useTradingStore((state) => state.favoriteIds);
  const { toggleFavorite } = useFavorites();

  // Стейты для модалок
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  //Расчеты для боковой панели
  const selectedItems = cartItems.filter((item) => item.selected);
  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const isAllSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  // Обработчик удаления одного товара
  const handleConfirmSingle = () => {
    if (deletingId) {
      removeItem(deletingId);
      setDeletingId(null);
    }
  };

  // Обработчик массового удаления
  const handleConfirmBulk = () => {
    const ids = selectedItems.map((i) => i.id);
    removeSelected(ids);
    setIsBulkDeleteOpen(false);
  };

  if (cartItems.length === 0) {
    return <div className={styles.empty}>Ваша корзина пуста 🛒</div>;
  }

  return (
    <main className={styles.CartPage}>
      {/* МОДАЛКА ДЛЯ ОДНОГО ТОВАРА */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Вы действительно хотите удалить этот товар из корзины?"
        onConfirm={handleConfirmSingle}
        onCancel={() => setDeletingId(null)}
      />

      {/* МОДАЛКА ДЛЯ МАССОВОГО УДАЛЕНИЯ */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Удалить выбранные товары (${selectedItems.length} шт.)?`}
        onConfirm={handleConfirmBulk}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      <h1 className={styles.title}>Корзина</h1>

      <div className={styles.content}>
        {/* ЛЕВАЯ ЧАСТЬ: Список товаров 🏍️ */}
        <div className={styles.main}>
          <div className={styles.controls}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
              Выбрать все
            </label>
            <button
              className={styles.deleteSelected}
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={selectedItems.length === 0}
            >
              Удалить выбранные
            </button>
          </div>

          <div className={styles.list}>
            {cartItems.map((item) => {
              return (
                <div key={item.id} className={styles.cartItem}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleSelectItem(item.id)}
                  />

                  <div className={styles.itemImg}>
                    <img
                      src={
                        item.image
                          ? `http://localhost:3001/static/motorcycles/${item.image}`
                          : "http://localhost:3001/static/defaults/default-card-icon.jpg"
                      }
                      alt=""
                    />
                  </div>

                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.model}</h3>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.favIconBtn} ${favoriteIds.includes(item.id) ? styles.active : ""}`}
                        onClick={() => toggleFavorite(item.id)}
                        title={
                          favoriteIds.includes(item.id)
                            ? "Удалить из избранного"
                            : "В избранное"
                        }
                      >
                        {favoriteIds.includes(item.id) ? "❤️" : "🤍"}
                      </button>
                      <button onClick={() => setDeletingId(item.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>

                  <div className={styles.quantityControl}>
                    <button
                      onClick={() =>
                        updateQuantity({
                          id: item.id,
                          quantity: item.quantity - 1,
                        })
                      }
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity({
                          id: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.priceBlock}>
                    <span className={styles.currentPrice}>
                      {item.price?.toLocaleString() ?? 0} ₽ / шт.
                    </span>
                    <span className={styles.totalItemPrice}>
                      {(item.price * item.quantity).toLocaleString()} ₽
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Итоговая цена */}
        <aside className={styles.summary}>
          <h3>Условия заказа</h3>
          <div className={styles.summaryRow}>
            <span>Выбрано товаров:</span>
            <span>{selectedItems.length}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Итого:</span>
            <span>{totalPrice.toLocaleString()} ₽</span>
          </div>
          <button
            className={styles.checkoutBtn}
            disabled={selectedItems.length === 0}
          >
            Перейти к оформлению
          </button>
        </aside>
      </div>
    </main>
  );
};
