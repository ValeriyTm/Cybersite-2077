import { useState } from "react";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import styles from "./CheckoutPage.module.scss";

export const CheckoutPage = () => {
  const { cartItems } = useTradingStore();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Считаем сумму выбранных товаров
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  return (
    <main className={styles.CheckoutPage}>
      <h1 className={styles.title}>Оформление заказа</h1>

      <div className={styles.content}>
        <div className={styles.left}>
          {/* БЛОК 1: АДРЕС */}
          <section className={styles.section}>
            <h3>1. Адрес доставки</h3>
            <div className={styles.addressBox}>
              {address ? (
                <p className={styles.currentAddress}>📍 {address}</p>
              ) : (
                <p className={styles.noAddress}>Адрес не выбран</p>
              )}
              <button
                className={styles.mapBtn}
                onClick={() => {
                  /* Откроет карту */
                }}
              >
                {address ? "Изменить на карте" : "Выбрать на карте"}
              </button>
            </div>
          </section>

          {/* БЛОК 2: СОСТАВ ЗАКАЗА (мини-список) */}
          <section className={styles.section}>
            <h3>2. Состав заказа</h3>
            <div className={styles.previewList}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.miniItem}>
                  <span>
                    {item.model} x {item.quantity} шт, {item.year} г
                  </span>
                  <span>{(item.price * item.quantity).toLocaleString()} ₽</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: ИТОГО */}
        <aside className={styles.summary}>
          <h3>Ваш заказ</h3>
          <div className={styles.row}>
            <span>Товары ({cartItems.length}):</span>
            <span>{subtotal.toLocaleString()} ₽</span>
          </div>
          <div className={styles.row}>
            <span>Доставка:</span>
            <span>{coords ? "Рассчитывается..." : "Выберите адрес"}</span>
          </div>
          <div className={`${styles.row} ${styles.total}`}>
            <span>К оплате:</span>
            <span>{subtotal.toLocaleString()} ₽</span>
          </div>

          <button
            className={styles.payBtn}
            disabled={!coords}
            onClick={() => {
              /* Создание заказа */
            }}
          >
            Создать заказ и оплатить
          </button>
        </aside>
      </div>
    </main>
  );
};
