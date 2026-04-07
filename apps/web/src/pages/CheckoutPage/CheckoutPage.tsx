import { useEffect, useMemo, useState } from "react";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import styles from "./CheckoutPage.module.scss";
import { DeliveryMapModal } from "@/features/ordering/DeliveryMapModal/DeliveryMapModal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { useNavigate } from "react-router";
import { useProfile } from "@/features/auth/model/useProfile";
import { useOrderStore } from "@/entities/ordering/model/orderStore";
import { useLocation } from "react-router";
import toast from "react-hot-toast";

export const CheckoutPage = () => {
  const { cartItems, fetchCart } = useTradingStore();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useProfile();

  const { fetchActiveCount } = useOrderStore();

  //Информация о промокоде:
  const promoFromCart = location.state?.promo;

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
    mutationFn: (orderData: any) => $api.post("/orders", orderData),
    onSuccess: (res) => {
      //Обновляем корзину в Zustand (она уже очищена на бэкенде в Redis):
      fetchCart();
      //Обновляем счётчик в Header:
      fetchActiveCount();
      //Отправляем пользователя на страницу ЮKassa:
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    },
    onError: (err) => toast.error("Ошибка при создании заказа"),
  });

  //Если пользователь вручную ввел адрес /checkout, но у него в корзине только «нелегальные» товары или вообще ничего не выбрано, его нужно выкинуть обратно в корзину:
  useEffect(() => {
    if (legalSelectedItems.length === 0) {
      navigate("/cart");
    }
  }, [legalSelectedItems, navigate]);

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

  ////---------------------------Сумма заказа:-------------------////
  //-----Считаем сумму выбранных товаров без скидок и промокодов:
  // const subtotalPre = legalSelectedItems.reduce(
  //   (acc, item) => acc + item.price * item.quantity,
  //   0,
  // );
  // const subtotal = subtotalPre - Number(promoFromCart?.amount || 0);

  //Сумма товаров с учетом их индивидуальных скидок:
  const itemsTotal = legalSelectedItems.reduce((acc, item) => {
    const price = item.discountData?.finalPrice ?? item.price; //Если указана цена с учетом скидки - берем её. Если не указана - берем просто цену
    return acc + price * item.quantity;
  }, 0);

  //Уменьшение суммы от промокода:
  const promoDiscount = Number(promoFromCart?.amount || 0);
  //Стоимость доставки:
  const deliveryCost = Number(deliveryInfo?.cost || 0);
  //Финальная сумма заказа:
  const finalOrderPrice = Math.max(
    0,
    itemsTotal + deliveryCost - promoDiscount,
  );

  //Передаем итоговую цену в мутацию создания заказа:
  const handleCreateOrder = () => {
    const payload = {
      items: legalSelectedItems.map((item) => ({
        id: item.id,
        model: item.model,
        price: item.discountData?.finalPrice ?? item.price, //Фиксируем цену со скидкой на момент покупки
        quantity: item.quantity,
      })),
      address,
      coords,
      deliveryInfo,
      promoCode: promoFromCart?.code || null,
      totalPrice: finalOrderPrice,
    };

    createOrderMutation.mutate(payload);
  };

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
            <span>+ {itemsTotal.toLocaleString()} ₽</span>
          </div>

          <div className={styles.row}>
            <span>Доставка:</span>
            <span>
              {deliveryInfo
                ? `+ ${deliveryInfo.cost.toLocaleString()} ₽`
                : "Выберите адрес"}
            </span>
          </div>

          <div className={styles.row}>
            <span>Промокод:</span>
            <span>
              {promoFromCart?.amount
                ? `- ${promoFromCart?.amount.toLocaleString()} ₽`
                : "Не применен"}
            </span>
          </div>

          <div className={`${styles.row} ${styles.total}`}>
            <span>К оплате:</span>
            {/*Считаем итого: товары + доставка:*/}
            <span>{finalOrderPrice.toLocaleString()} ₽</span>
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
