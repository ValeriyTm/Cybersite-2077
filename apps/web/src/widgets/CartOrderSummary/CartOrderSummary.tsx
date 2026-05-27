//Состояние:
import { useState } from "react";
//Навигация:
import { useNavigate } from "react-router";
//API:
import { $api } from "@/shared/api";
//Компоненты:
import { Input, Button } from "@/shared/ui";
//Уведомления:
import toast from "react-hot-toast";
// Типы:
import { type MotorcycleCart } from "@/entities/catalog";
import type { IUser } from "@repo/types";
//Стили:
import styles from "./CartOrderSummary.module.scss";

interface CartOrderSummaryProps {
  selectedItems: MotorcycleCart[];
  user: IUser;
}

export const CartOrderSummary = ({ selectedItems, user }: CartOrderSummaryProps) => {
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; amount: number } | null>(null);

  // Расчет стоимости выделенных товаров
  const subtotal = selectedItems.reduce(
    (acc, item) => acc + (item.discountData?.finalPrice || item.price) * item.quantity,
    0
  );
  const promoAmount = Number(appliedPromo?.amount || 0);
  const finalTotal = Math.max(0, subtotal - promoAmount);

  //Условия, при которых недопустим переход к оформлению заказа:
  const isProfileIncomplete = user ? (!user.phone || !user.birthday) : false;
  const hasStockErrorInSelected = selectedItems.some((item) => item.quantity > item.totalInStock);

  //Применение промокода:
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await $api.post("/discount/apply-promo", { code: promoCode });
      setAppliedPromo({ code: res.data.code, amount: res.data.discountAmount });
      toast.success(`Промокод ${res.data.code} применен!`);
    } catch (e) {
      setAppliedPromo(null);
      toast.error("Промокод не найден, истек или уже использован");
      console.error("Ошибка промокода:", e);
    }
  };

  //Переход к оплате:
  const handleOrder = () => {
    if (!user?.phone || !user?.birthday) {
      toast.error("Для оформления заказа необходимо указать телефон и дату рождения в профиле!");
      return;
    }

    //Я.Метрика:
    const metricaId = import.meta.env.VITE_YANDEX_METRICA_ID;
    if (typeof window !== "undefined" && (window as any).ym) {
      (window as any).ym(metricaId, "reachGoal", "ORDER_CLICK");
    }

    navigate("/checkout", {
      state: { promo: appliedPromo, allowed: true }
    });
  };

  return (
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
          ⚠️ Заполните телефон и дату рождения в профиле для оформления заказа
        </p>
      )}
      {hasStockErrorInSelected && (
        <p className={styles.warning}>
          ❌ Исправьте количество товаров (превышен остаток на складах)
        </p>
      )}

      {/* <button
        type="button"
        className={styles.checkoutBtn}
        disabled={selectedItems.length === 0 || hasStockErrorInSelected}
        onClick={(e) => { e.stopPropagation(); handleOrder(); }}
      >
        Перейти к оформлению
      </button> */}

      <Button type="button" variant="primary" disabled={selectedItems.length === 0 || hasStockErrorInSelected} onClick={(e) => { e.stopPropagation(); handleOrder(); }}>
        Перейти к оформлению
      </Button>

      {/* Зона промокода */}
      <div className={styles.promoSection}>
        <p className={styles.promoLabel}>Промокод на скидку:</p>
        {!appliedPromo ? (
          <div className={styles.inputGroup}>
            <div className={styles.inputGroupItem}>
              <Input
                id="promo"
                type="text"
                placeholder="ВВЕДИТЕ СЛОВО"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                label="Ввести промокод"
                visuallyHidden
                variant="dark"
                center
              />
            </div>

            <div className={styles.inputGroupItem}>
              <Button type="button" variant="outline" onClick={handleApplyPromo}>
                Применить
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.successMsg}>
            ✅ Промокод <strong>{appliedPromo.code}</strong> применен:
            <br />
            <span className={styles.discountAmount}> -{appliedPromo.amount.toLocaleString()} ₽</span>
            <br />
            <div className={styles.cancelPromoRow}>
              <span>Отменить промокод: </span>
              <button type="button" className={styles.removeBtn} onClick={() => setAppliedPromo(null)}>✕</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
