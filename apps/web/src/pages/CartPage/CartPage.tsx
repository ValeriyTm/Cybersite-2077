import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useCart } from "@/entities/trading/api/useCart";
import { useFavorites } from "@/entities/trading/api/useFavorites";
import styles from "./CartPage.module.scss";
import { ConfirmModal } from "@/shared/ui/ConfirmModal/ConfirmModal";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useProfile } from "@/features/auth/model/useProfile";
import { useNavigate } from "react-router";
import { $api } from "@/shared/api/api";
import toast from "react-hot-toast";

export const CartPage = () => {
  const { cartItems, toggleSelectItem, toggleSelectAll, updateItemQuantity } =
    useTradingStore();
  const { updateQuantity, removeItem, removeSelected } = useCart();

  //Для промокода:
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  const { user } = useProfile(); // Достаем данные профиля

  const favoriteIds = useTradingStore((state) => state.favoriteIds);
  const { toggleFavorite } = useFavorites();

  const navigate = useNavigate();

  //Стейты для модалок
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  //Для применения промокода:
  const handleApplyPromo = async () => {
    try {
      const res = await $api.post("/discount/apply-promo", { code: promoCode });
      setAppliedPromo({ code: res.data.code, amount: res.data.discountAmount });
      toast.success(`Промокод ${res.data.code} применен!`);
    } catch (e) {
      setAppliedPromo(null);
      toast.error("Промокод не найден, истек или уже использован");
    }
  };

  //Расчеты для боковой панели

  // const totalPrice = selectedItems.reduce(
  //   (acc, item) => acc + item.price * item.quantity,
  //   0,
  // );

  //Применяем скидки к сумме заказа:
  const selectedItems = cartItems.filter((item) => item.selected);

  const subtotal = selectedItems.reduce(
    (acc, item) =>
      acc + (item.discountData?.finalPrice || item.price) * item.quantity,
    0,
  );

  const finalTotal = useMemo(() => {
    const promoAmount = Number(appliedPromo?.amount || 0);
    return Math.max(0, subtotal - promoAmount);
  }, [subtotal, appliedPromo]);

  console.log("ДЛЯ ПРОВЕРКИ:", {
    sub: subtotal,
    res: finalTotal,
  });
  //Уменьшение цены от промокода:
  // let promoAmount = appliedPromo?.amount ? appliedPromo?.amount : 0;

  // const currentPromoAmount = Number(appliedPromo?.amount || 0);
  // const currentSubtotal = Number(subtotal || 0);
  //Применяем промокод к сумме заказа (конечная сумма):
  // const finalTotal = Math.max(0, currentSubtotal - currentPromoAmount);

  const isAllSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  //Обработчик удаления одного товара
  const handleConfirmSingle = () => {
    if (deletingId) {
      removeItem(deletingId);
      setDeletingId(null);
    }
  };

  //Обработчик массового удаления
  const handleConfirmBulk = () => {
    const ids = selectedItems.map((i) => i.id);
    removeSelected(ids);
    setIsBulkDeleteOpen(false);
  };

  //--------------Проверяем допустимо ли юзеру нажать кнопку оформления заказа:-----
  //Проверяем заполненность профиля
  const isProfileIncomplete = !user?.phone || !user?.birthday;

  //Проверяем остатки среди выбранных товаров:
  const hasStockErrorInSelected = selectedItems.some(
    (item) => item.quantity > item.totalInStock,
  );

  const isCheckoutDisabled =
    selectedItems.length === 0 || //Ничего не выбрано
    hasStockErrorInSelected || //Выбран товар, которого нет на складе (или кол-во не соответствует)
    isProfileIncomplete; //Профиль не заполнен

  ///--------------------------
  if (cartItems.length === 0) {
    return <div className={styles.empty}>Ваша корзина пуста 🛒</div>;
  }

  return (
    <main className={styles.CartPage}>
      {/*Модалка для удаления одного товара из корзины*/}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Вы действительно хотите удалить этот товар из корзины?"
        onConfirm={handleConfirmSingle}
        onCancel={() => setDeletingId(null)}
      />

      {/*Модалка для массового удаления товаров из корзины*/}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Удалить выбранные товары (${selectedItems.length} шт.)?`}
        onConfirm={handleConfirmBulk}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      <h1 className={styles.title}>Корзина</h1>

      <div className={styles.content}>
        {/* Список товаров */}
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
              //Ошибка, если товара на складе осталось меньше, чем у нас в корзине:
              const isError = item.quantity > item.totalInStock;
              //Скидки:
              const hasDiscount =
                item.discountData && item.discountData.discountPercent > 0;
              const displayPrice = hasDiscount
                ? item.discountData.finalPrice
                : item.price;
              return (
                <div
                  key={item.id}
                  className={`${styles.cartItem} ${isError && styles.Error}`}
                >
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
                    <Link
                      to={`/catalog/motorcycles/${item.brandSlug}/${item.slug}`}
                      className={styles.itemName}
                    >
                      <p>
                        {item.model}, {item.year} г
                      </p>
                    </Link>

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

                  {/* <div className={styles.priceBlock}>
                    <span className={styles.currentPrice}>
                      {item.price?.toLocaleString() ?? 0} ₽ / шт.
                    </span>
                    <span className={styles.totalItemPrice}>
                      {(item.price * item.quantity).toLocaleString()} ₽
                    </span>
                  </div> */}

                  <div className={styles.priceBlock}>
                    {hasDiscount ? (
                      <>
                        {/*Старая цена:*/}
                        <span className={styles.oldPrice}>
                          {item.price?.toLocaleString() ?? 0} ₽ / шт.
                        </span>
                        {/*Новая цена:*/}
                        <span className={styles.currentPrice}>
                          {displayPrice.toLocaleString() ?? 0} ₽ / шт.
                        </span>
                        {/*Общая сумма:*/}
                        <span className={styles.totalItemPrice}>
                          {(displayPrice * item.quantity).toLocaleString()} ₽
                        </span>
                        {/*Скидка:*/}
                        <span className={styles.badgeDiscount}>
                          -{item.discountData.discountPercent}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={styles.currentPrice}>
                          {item.price?.toLocaleString() ?? 0} ₽ / шт.
                        </span>
                        <span className={styles.totalItemPrice}>
                          {(item.price * item.quantity).toLocaleString()} ₽
                        </span>
                      </>
                    )}
                  </div>

                  {isError && (
                    <span className={styles.errorHint}>
                      Ошибка: на складе осталось всего {item.totalInStock} шт.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Боковая панель: Итоговая цена */}
        <aside className={styles.summary}>
          <h3>Условия заказа</h3>
          <div className={styles.summaryRow}>
            <span>Выбрано товаров:</span>
            <span>{selectedItems.length}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Итого:</span>
            <span>{finalTotal.toLocaleString()} ₽</span>
          </div>

          {isProfileIncomplete && (
            <p className={styles.warning}>
              ⚠️ Заполните телефон и дату рождения в профиле для оформления
              заказа
            </p>
          )}

          {hasStockErrorInSelected && (
            <p className={styles.warning}>
              ❌ Исправьте количество товаров (превышен остаток на складах)
            </p>
          )}

          <button
            type="button"
            className={styles.checkoutBtn}
            disabled={isCheckoutDisabled}
            onClick={(e) => {
              e.stopPropagation(); //Останавливаем "шум" для других компонентов
              navigate("/checkout", {
                state: { promo: appliedPromo }, //Передаём промокод в state
              });
            }}
          >
            Перейти к оформлению
          </button>

          {/*Зона ввода промокода:*/}
          <div className={styles.promoSection}>
            <p className={styles.promoLabel}>Промокод на скидку:</p>

            {!appliedPromo ? (
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="ВВЕДИТЕ СЛОВО"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                />
                <button className={styles.applyBtn} onClick={handleApplyPromo}>
                  Применить
                </button>
              </div>
            ) : (
              <div className={styles.successMsg}>
                ✅ Промокод <strong>{appliedPromo.code}</strong> применен:
                <br></br>
                <span> -{appliedPromo.amount.toLocaleString()} ₽</span>
                <br></br>
                <span>Отменить промокод: </span>
                <button
                  className={styles.removeBtn}
                  onClick={() => setAppliedPromo(null)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
};
