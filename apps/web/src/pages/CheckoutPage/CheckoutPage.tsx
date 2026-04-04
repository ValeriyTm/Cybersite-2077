import { useEffect, useMemo, useState } from "react";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import styles from "./CheckoutPage.module.scss";
import { DeliveryMapModal } from "@/features/ordering/DeliveryMapModal/DeliveryMapModal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { useNavigate } from "react-router";
import { useProfile } from "@/features/auth/model/useProfile";
import { useOrderStore } from "@/entities/ordering/model/orderStore";

export const CheckoutPage = () => {
  const { cartItems, fetchCart } = useTradingStore();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const navigate = useNavigate();

  const { user } = useProfile();

  const { fetchActiveCount } = useOrderStore();

  //Отбираем только выбранные юзером в корзине товары:
  const legalSelectedItems = useMemo(
    () =>
      cartItems.filter(
        (item) =>
          item.selected &&
          item.quantity <= item.totalInStock &&
          item.totalInStock > 0,
      ),
    [cartItems],
  );

  //Создаем стейт для хранения ответа от "/api/warehouse/calculate":
  const [deliveryInfo, setDeliveryInfo] = useState<{
    warehouse: any;
    cost: number;
    days: number;
    estimatedDate: string;
    distanceKm: number;
  } | null>(null);

  //Подставляем дефолтный адрес доставки из БД для юзера:
  useEffect(() => {
    //Проверяем, есть ли юзер, есть ли легальные товары и подгружены ли остатки:
    const hasStockData = legalSelectedItems.every(
      (item) => item.totalInStock !== undefined,
    );

    if (user?.defaultLat && legalSelectedItems.length > 0 && hasStockData) {
      const savedCoords = { lat: user.defaultLat, lng: user.defaultLng };

      setAddress(user.defaultAddress || "");
      setCoords(savedCoords);

      //Запускаем расчет только когда данные "прогреты":
      calculateMutation.mutate({
        lat: savedCoords.lat,
        lng: savedCoords.lng,
        items: legalSelectedItems.map((i) => ({
          id: i.id,
          quantity: i.quantity,
        })),
      });
    }
  }, [user, legalSelectedItems]); //Сработает, как только данные юзера загрузятся

  //Карта:
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => $api.get("/warehouse").then((res) => res.data),
  });

  //Создаем мутацию для расчета доставки:
  const calculateMutation = useMutation({
    mutationFn: (data: { lat: number; lng: number; items: any[] }) =>
      $api.post("/warehouse/calculate", data).then((res) => res.data),
    onSuccess: (data) => {
      //Сохраняем данные от бэкенда в стейт страницы:
      setDeliveryInfo(data);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) =>
      $api.post("/orders", orderData).then((res) => res.data),

    onSuccess: () => {
      //Обновляем корзину в Zustand (она уже очищена на бэкенде в Redis):
      fetchCart();

      //Обновляем счётчик в Header:
      fetchActiveCount();

      //Редиректим юзера на страницу его заказов:
      navigate("/orders/my", { state: { success: true } });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Ошибка при создании заказа");
    },
  });

  //Если пользователь вручную ввел адрес /checkout, но у него в корзине только «нелегальные» товары или вообще ничего не выбрано, его нужно выкинуть обратно в корзину:
  useEffect(() => {
    if (legalSelectedItems.length === 0) {
      navigate("/cart");
    }
  }, [legalSelectedItems, navigate]);

  const handleCreateOrder = () => {
    const payload = {
      items: legalSelectedItems.map((item) => ({
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

    //Отправляем координаты + текущую корзину:
    calculateMutation.mutate({
      lat: coords.lat,
      lng: coords.lng,
      items: legalSelectedItems.map((i) => ({
        id: i.id,
        quantity: i.quantity,
      })),
    });
  };

  //-----Считаем сумму выбранных товаров:
  const subtotal = legalSelectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  return (
    <main className={styles.CheckoutPage}>
      <h1 className={styles.title}>Оформление заказа</h1>

      <div className={styles.content}>
        <div className={styles.left}>
          {/*Блок 1 - адрес:*/}
          <section className={styles.section}>
            <h3>1. Адрес доставки</h3>
            <div className={styles.addressBox}>
              {address ? (
                <>
                  <p className={styles.currentAddress}>📍 {address}</p>
                  <button
                    className={styles.changeBtn}
                    onClick={() => setIsMapOpen(true)}
                  >
                    Изменить адрес доставки
                  </button>
                </>
              ) : (
                <button
                  className={styles.mapBtn}
                  onClick={() => setIsMapOpen(true)}
                >
                  Выбрать адрес на карте
                </button>
              )}
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
              initialCoords={coords} //Передаем дефолтные координаты адреса доставки для юзера (из БД юзера)
              onSelect={handleAddressSelect}
              onClose={() => setIsMapOpen(false)}
            />
          )}

          {/*Блок 2 - состав заказа:*/}
          <section className={styles.section}>
            <h3>2. Состав заказа</h3>
            <div className={styles.previewList}>
              {legalSelectedItems.map((item) => (
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

        {/*Правая панель - итого:*/}
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
            {/*Считаем итого: товары + доставка:*/}
            <span>
              {(subtotal + (deliveryInfo?.cost || 0)).toLocaleString()} ₽
            </span>
          </div>

          <button
            className={styles.payBtn}
            disabled={!deliveryInfo || createOrderMutation.isPending} //Кнопка активна только когда доставка посчитана
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
