//Состояния:
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useCart } from "@/entities/trading/api/useCart";
import { useMemo, useState, useEffect } from "react";
import { useProfile } from "@/features/auth/model/useProfile";
import { useQueryClient } from "@tanstack/react-query";
//Навигация:
import { useNavigate } from "react-router";
//Компоненты:
import { ConfirmModal } from "@/shared/ui/ConfirmModal/ConfirmModal";
import { CartItem } from "@/entities/trading/ui/CartItem/CartItem";
//API:
import { $api } from "@/shared/api/api";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from "./CartPage.module.scss";



export const CartPage = () => {
  const { user } = useProfile(); // Достаем данные профиля

  const { cartItems } =
    useTradingStore();
  const {
    removeItem,
    removeSelected,
    selectAll,
  } = useCart();

  const queryClient = useQueryClient();

  useEffect(() => {
    // Заставляем React Query заново сходить на сервер за корзиной при каждом монтировании
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [queryClient]);


  //Проверяем, выбраны ли все товары сейчас:
  const isAllSelected =
    cartItems.length > 0 && cartItems.every((item) => item.selected);

  //Для промокода:
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    amount: number;
  } | null>(null);


  const navigate = useNavigate();

  //Стейты для модалок
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  //------------------------------Расчёт цены:--------------------------//
  const selectedItems = cartItems.filter((item) => item.selected); //Рассматриваем не все товары корзины, а только выделенные
  //Применяем к ним действие скидок:
  const subtotal = selectedItems.reduce(
    (acc, item) =>
      acc + (item.discountData?.finalPrice || item.price) * item.quantity,
    0,
  );
  //Применяем действие промокодов и получаем конечную цену:
  const finalTotal = useMemo(() => {
    const promoAmount = Number(appliedPromo?.amount || 0); //Уменьшение суммы от промокода
    return Math.max(0, subtotal - promoAmount); //Получаем конечную сумму
  }, [subtotal, appliedPromo]); //Пересчитываем при каждом изменении выделенных товаров и примененного промокода

  //Обработчик удаления одного товара из корзины:
  const handleConfirmSingle = () => {
    if (deletingId) {
      removeItem(deletingId);
      setDeletingId(null);
    }
  };
  //-----------------------------------Обработчики----------------------------//
  //
  const handleDeletingId = (data) => {
    setDeletingId(data);
  }


  //Обработчик для применения промокода:
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

  //Обработчик для выбора всех чекбоксов:
  const handleToggleAll = () => {
    selectAll(!isAllSelected);
  };

  //Обработчик массового удаления товаров из корзины:
  const handleConfirmBulk = () => {
    const ids = selectedItems.map((i) => i.id);
    removeSelected(ids); // Передаем массив
    setIsBulkDeleteOpen(false);
  };

  //--------------Проверяем допустимо ли юзеру нажать кнопку оформления заказа:-----//
  //Проверяем заполненность профиля
  const isProfileIncomplete = !user?.phone || !user?.birthday;

  //Проверяем остатки среди выбранных товаров:
  const hasStockErrorInSelected = selectedItems.some(
    (item) => item.quantity > item.totalInStock,
  );

  //Итог - доступна ли кнопка оформления заказа:
  const isCheckoutDisabled =
    selectedItems.length === 0 || //Ничего не выбрано
    hasStockErrorInSelected || //Выбран товар, которого нет на складе (или кол-во не соответствует)
    isProfileIncomplete; //Профиль не заполнен

  ///--------------------------При отсутствии товаров:------------------------//
  if (cartItems.length === 0) {
    return <div className={styles.empty}>Ваша корзина пуста 🛒</div>;
  }

  return (
    <main className={styles.CartPage}>
      {/*1) Модалка для удаления одного товара из корзины*/}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Вы действительно хотите удалить этот товар из корзины?"
        onConfirm={handleConfirmSingle}
        onCancel={() => setDeletingId(null)}
      />

      {/*2) Модалка для массового удаления товаров из корзины*/}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Удалить выбранные товары (${selectedItems.length} шт.)?`}
        onConfirm={handleConfirmBulk}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      <h1 className={styles.title}>Корзина</h1>

      <div className={styles.content}>
        {/*3) Header:*/}
        <div className={styles.main}>
          <div className={styles.controls}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleAll}
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

          {/*4) Список товаров:*/}
          <div className={styles.list}>
            {cartItems.map((item) => {
              return (
                <CartItem key={item.id} data={item} handleDeletingId={handleDeletingId} />
              )
            })}
          </div>
        </div>

        {/*5) Сайдбар с итоговой ценой:*/}
        <aside className={styles.summary}>
          {/*5.1.) Окно с ценой и кнопкой оформления заказа:*/}
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

          {/*5.2.) Зона ввода промокода:*/}
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
