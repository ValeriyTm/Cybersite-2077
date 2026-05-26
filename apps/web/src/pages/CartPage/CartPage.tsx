//Состояния:
import { useTradingStore, useCart } from "@/entities/trading";
import { useState } from "react";
import { useProfile } from "@/features/auth";
//Компоненты:
import { Checkbox, ConfirmModal } from "@/shared/ui";
import { CartCard } from "@/widgets/CartCard";
import { CartOrderSummary } from "@/widgets/CartOrderSummary";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./CartPage.module.scss";

export const CartPage = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { user } = useProfile(); // Достаем данные профиля

  const { cartItems } = useTradingStore();
  const {
    removeItem,
    removeSelected,
    selectAll,
  } = useCart();

  //Проверяем, выбраны ли все товары сейчас:
  const isAllSelected =
    cartItems.length > 0 && cartItems.every((item) => item.selected);

  //Выбранные товары:
  const selectedItems = cartItems.filter((item) => item.selected);

  //-----------------------------------Обработчики----------------------------//
  //Обработчик удаления одного товара из корзины:
  const handleConfirmSingle = () => {
    if (deletingId) {
      removeItem(deletingId);
      setDeletingId(null);
    }
  };

  //Обработчик удаления выбранных товаров:
  const handleDeletingId = (data: string) => {
    setDeletingId(data);
  }

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

  ///--------------------------При отсутствии товаров:------------------------//
  if (cartItems.length === 0 && !user) {
    return <div className={styles.empty}>Ваша корзина пуста 🛒</div>;
  }

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Моя корзина</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className={styles.CartPage}>
        <h1 className={styles.title}>Корзина</h1>
        <div className={styles.content}>
          {/*Header:*/}
          <div className={styles.main}>
            <div className={styles.controls}>
              <Checkbox
                label="Выбрать все"
                checked={isAllSelected}
                onChange={handleToggleAll}
              />
              <button
                className={styles.deleteSelected}
                onClick={() => setIsBulkDeleteOpen(true)}
                disabled={selectedItems.length === 0}
              >
                Удалить выбранные
              </button>
            </div>

            {/*Список товаров:*/}
            <div className={styles.list}>
              {cartItems.map((item) => {
                return (
                  <CartCard key={item.id} data={item} handleDeletingId={handleDeletingId} />
                )
              })}
            </div>
          </div>

          {/*Сайдбар с итоговой ценой:*/}
          <CartOrderSummary selectedItems={selectedItems} user={user!} />
        </div>

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
      </main>
    </>

  );
};
