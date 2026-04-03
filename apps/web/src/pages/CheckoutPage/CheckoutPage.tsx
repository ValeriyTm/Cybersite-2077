import { useEffect, useMemo, useState } from "react";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import styles from "./CheckoutPage.module.scss";
import { DeliveryMapModal } from "@/features/ordering/DeliveryMapModal/DeliveryMapModal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { useNavigate } from "react-router";
import { useProfile } from "@/features/auth/model/useProfile";

export const CheckoutPage = () => {
  const { cartItems, fetchCart } = useTradingStore();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const navigate = useNavigate();

  const { user } = useProfile();

  // 1. Создаем стейт для хранения ответа от /api/warehouse/calculate
  const [deliveryInfo, setDeliveryInfo] = useState<{
    warehouse: any;
    cost: number;
    days: number;
    estimatedDate: string;
    distanceKm: number;
  } | null>(null);

  useEffect(() => {
    if (user?.defaultAddress && user?.defaultLat && user?.defaultLng) {
      const savedCoords = { lat: user.defaultLat, lng: user.defaultLng };

      setAddress(user.defaultAddress);
      setCoords(savedCoords);

      //Сразу запускаем расчет доставки, чтобы юзер видел цену
      calculateMutation.mutate({
        lat: savedCoords.lat,
        lng: savedCoords.lng,
        items: cartItems
          .filter((i) => i.selected)
          .map((i) => ({ id: i.id, quantity: i.quantity })),
      });
    }
  }, [user]); // Сработает, как только данные юзера загрузятся

  //Карта:
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => $api.get("/warehouse").then((res) => res.data),
  });

  //1. Создаем мутацию для расчета доставки:
  const calculateMutation = useMutation({
    mutationFn: (data: { lat: number; lng: number; items: any[] }) =>
      $api.post("/warehouse/calculate", data).then((res) => res.data),
    onSuccess: (data) => {
      // Сохраняем данные от бэкенда в стейт страницы
      setDeliveryInfo(data);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) =>
      $api.post("/orders", orderData).then((res) => res.data),

    onSuccess: () => {
      // 1. Обновляем корзину в Zustand (она уже очищена на бэкенде в Redis)
      fetchCart();

      // 2. Редиректим юзера на страницу его заказов
      // Мы её создадим следующим шагом
      navigate("/orders/my", { state: { success: true } });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Ошибка при создании заказа");
    },
  });

  //Отбираем только выбранные юзером в корзине товары:
  const selectedItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems],
  );

  const handleCreateOrder = () => {
    const payload = {
      items: selectedItems.map((item) => ({
        id: item.id,
        model: item.model,
        price: item.price,
        quantity: item.quantity,
      })),
      address,
      coords,
      deliveryInfo,
      totalPrice: subtotal + (deliveryInfo?.cost || 0),
    };

    createOrderMutation.mutate(payload);
  };

  const handleAddressSelect = (
    coords: { lat: number; lng: number },
    addr: string,
  ) => {
    setCoords(coords);
    setAddress(addr);
    setIsMapOpen(false);

    // Отправляем координаты + текущую корзину 🚀
    calculateMutation.mutate({
      lat: coords.lat,
      lng: coords.lng,
      items: selectedItems.map((i) => ({ id: i.id, quantity: i.quantity })),
    });
  };

  //-----Считаем сумму выбранных товаров:
  const subtotal = selectedItems.reduce(
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

              {/*Кнопка открытия модалки с картой:*/}
              <button
                className={styles.mapBtn}
                onClick={() => setIsMapOpen(true)}
              >
                {address ? "Изменить на карте" : "Выбрать на карте"}
              </button>
            </div>

            <div className={styles.deliveryInfoStyle}>
              <span>Расчетная дата доставки:</span>
              <span>
                {deliveryInfo
                  ? new Date(deliveryInfo.estimatedDate).toLocaleDateString()
                  : "Укажите адрес доставки"}
              </span>
            </div>
            <div className={styles.deliveryInfoStyle}>
              <span>Склад отправления:</span>
              <span>
                {deliveryInfo
                  ? deliveryInfo.warehouse.name
                  : "Укажите адрес доставки"}
              </span>
            </div>
          </section>
          {/*Сама модалка с картой:*/}
          {isMapOpen && (
            <DeliveryMapModal
              warehouses={warehouses || []}
              onSelect={handleAddressSelect}
              onClose={() => setIsMapOpen(false)}
            />
          )}

          {/* БЛОК 2: СОСТАВ ЗАКАЗА (мини-список) */}
          <section className={styles.section}>
            <h3>2. Состав заказа</h3>
            <div className={styles.previewList}>
              {selectedItems.map((item) => (
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
            <span>
              {deliveryInfo
                ? `${deliveryInfo.cost.toLocaleString()} ₽`
                : "Выберите адрес"}
            </span>
          </div>

          <div className={`${styles.row} ${styles.total}`}>
            <span>К оплате:</span>
            {/* Считаем Итого: Товары + Доставка */}
            <span>
              {(subtotal + (deliveryInfo?.cost || 0)).toLocaleString()} ₽
            </span>
          </div>

          <button
            className={styles.payBtn}
            disabled={!deliveryInfo || createOrderMutation.isPending} // Кнопка активна только когда доставка посчитана 🚀
            onClick={handleCreateOrder}
          >
            {createOrderMutation.isPending
              ? "Оформление..."
              : "Создать заказ и оплатить"}
          </button>
        </aside>
      </div>
    </main>
  );
};
