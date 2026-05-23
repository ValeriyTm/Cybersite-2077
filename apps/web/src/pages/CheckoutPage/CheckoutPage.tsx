//Роутинг:
import { useNavigate } from "react-router";
//Состояния:
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";
import { useOrderStore } from "@/entities/ordering";
import { useProfile } from "@/features/auth";
//API:
import { $api } from "@/shared/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { useEffect, useMemo, useState } from "react";
import { useTradingStore } from "@/entities/trading";
import { PaymentModal } from "@/shared/ui";
import { DeliveryMapModal } from "@/features/ordering";
//Типы:
import type { Warehouse } from "@repo/database/generated/prisma/client";
import type { MotorcycleCart } from "@/entities/catalog";
import type { DeliveryResponse } from "@/entities/ordering/types/types";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from "./CheckoutPage.module.scss";

interface CreateOrderPayload {
  items: {
    id: string;
    model: string;
    price: number;
    quantity: number;
  }[];
  address: string;
  coords: { lat: number; lng: number } | null;
  deliveryInfo: {
    warehouse: {
      id: string;
      name: string;
      city: string;
      lat: number;
      lng: number;
    };
    cost: number;
    days: number;
    estimatedDate: string;
    distanceKm: number;
  } | null
  promoCode: string | null;
  totalPrice: number;
  shouldPay: boolean;
}

export const CheckoutPage = () => {
  const { cartItems } = useTradingStore();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); //Состояние для pre-payment модалки:

  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useProfile();
  const { fetchActiveCount } = useOrderStore();

  const queryClient = useQueryClient();

  //Информация о промокоде:
  const promoFromCart = location.state?.promo;
  //Информация, что  юзер попал на страницу /checkout именно с корзины:
  const isAllowed = location.state?.allowed;
  // Получаем товары из истории переходов
  const itemsFromState = location.state?.itemsFromCart;

  // Выбираем источник данных: приоритет у state, запасной вариант - стора:
  const sourceItems = itemsFromState || cartItems; //!!!Новое

  console.log("RAW cartItems from store:", cartItems);
  //Брать его!
  console.log("RAW items from state:", location.state?.itemsFromCart);

  //Отбираем только выбранные юзером в корзине товары:
  const legalSelectedItems: MotorcycleCart[] = useMemo(
    () =>
      sourceItems.filter(
        //!!!Тут были cartItems
        (item) =>
          item.selected &&
          item.quantity <= item.totalInStock &&
          item.totalInStock > 0,
      ),
    [sourceItems], //!!!Тут были cartItems
  );

  console.log('legalSelectedItems: ', legalSelectedItems);

  //Стейт для хранения ответа от "/api/warehouse/calculate":
  const [deliveryInfo, setDeliveryInfo] = useState<{
    warehouse: Warehouse;
    cost: number;
    days: number;
    estimatedDate: string;
    distanceKm: number;
  } | null>(null);

  //Получаем склады с сервера:
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => $api.get("/warehouse").then((res) => res.data),
    staleTime: 24 * 60 * 60 * 1000,
  });

  //Создаем мутацию для расчета доставки:
  const calculateMutation = useMutation({
    mutationFn: async (data: { lat: number; lng: number; items: { id: string; quantity: number }[] }) => {
      return $api.post<DeliveryResponse>("/warehouse/calculate", data).then((res) => res.data);
    },
    onSuccess: (data) => {
      console.log("Данные расчета доставки с сервера:", data);

      //Сохраняем данные от бэкенда в стейт страницы:
      setDeliveryInfo(data);
    },
    onError: (error: any) => {
      //Берем сообщение, которое прислал бэкенд:
      const message = error.response?.data?.message || "Ошибка при расчете доставки";
      toast.error(message);
    },
  });


  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderPayload) => $api.post("/orders", orderData),
    onSuccess: (res, variables) => {
      const setCart = useTradingStore.getState().setCart;
      queryClient.setQueryData(["cart"], []);
      // variables — это данные, которые мы передали в mutate()

      //Чистим корзину:
      setCart([]);
      //Обновляем счётчик в Header:
      fetchActiveCount();

      if (variables.shouldPay && res.data.paymentUrl) {
        //Вариант 1: Редирект в ЮKassa (если создание заказа с оплатой):
        // window.location.href = res.data.paymentUrl;
        window.open(res.data.paymentUrl, "_blank");
        navigate("/orders/my", { replace: true });
      } else {
        //Вариант 2: Редирект на страницу заказов (если просто создание заказа):
        navigate("/orders/my", { replace: true }); //replace:true - чтобы нельзя было вернуться назад
        toast.success("Заказ оформлен!");
      }
    },
    onError: () => toast.error("Ошибка при создании заказа"),
  });

  // Флаг готовности остатков по товарам
  const hasStockData = useMemo(() => {
    return legalSelectedItems.length > 0 && legalSelectedItems.every(
      (item) => item.totalInStock != undefined,
    );
  }, [legalSelectedItems]);

  //Подставляем дефолтный адрес доставки из БД для юзера:
  useEffect(() => {
    //Если адрес уже установлен вручную или через этот же хук — выходим, чтобы не зацикливать:
    if (address || coords) return;

    if (user?.defaultLat && hasStockData) {
      const savedCoords = { lat: user.defaultLat, lng: user.defaultLng! };

      setTimeout(() => {
        setAddress(user.defaultAddress || "");
        setCoords(savedCoords);

        calculateMutation.mutate({
          lat: savedCoords.lat,
          lng: savedCoords.lng!,
          items: legalSelectedItems.map((i) => ({
            id: i.id,
            quantity: i.quantity,
          })),
        });
      }, 0);
    }
  }, [user?.defaultLat, user?.defaultLng, user?.defaultAddress, hasStockData]); //Сработает, как только данные юзера загрузятся

  //Если пользователь вручную ввел адрес /checkout, но у него в корзине только «нелегальные» товары или вообще ничего не выбрано, его нужно выкинуть обратно в корзину:
  useEffect(() => {
    if (!isAllowed && legalSelectedItems.length === 0) {
      navigate("/cart");
    }
  }, [isAllowed, legalSelectedItems.length, navigate]);

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


  //Сумма товаров с учетом их индивидуальных скидок:
  const itemsTotal = legalSelectedItems.reduce((acc, item) => {
    const price = item.discountData.finalPrice ?? item.price; //Если указана цена с учетом скидки - берем её. Если не указана - берем просто цену
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
  const handleCreateOrder = (shouldPay: boolean) => {
    const payload = {
      items: legalSelectedItems.map((item) => ({
        id: item.id,
        model: item.model,
        price: item.discountData.finalPrice ?? item.price, //Фиксируем цену со скидкой на момент покупки
        quantity: item.quantity,
      })),
      address,
      coords,
      deliveryInfo,
      promoCode: promoFromCart?.code || null,
      totalPrice: finalOrderPrice,
      shouldPay, //Прокидываем флаг, чтобы знать намерение юзера
    };

    createOrderMutation.mutate(payload);
  };

  //Для модалки оплаты:
  const handleConfirmPayment = () => {
    setIsModalOpen(false);
    handleCreateOrder(true); // Вызываем мутацию с флагом shouldPay
  };

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Оформление заказа</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
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

                    <span>{(item.discountData.finalPrice * item.quantity).toLocaleString()} ₽</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/*Правая панель - итого:*/}
          <aside className={styles.summary}>
            <h3>Ваш заказ</h3>
            <div className={styles.row}>
              <span>Товары ({legalSelectedItems.length}):</span>
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
              onClick={() => handleCreateOrder(false)}
            >
              {createOrderMutation.isPending
                ? "Оформление..."
                : "Создать заказ без оплаты"}
            </button>

            <button
              className={styles.payBtn}
              disabled={!deliveryInfo || createOrderMutation.isPending} //Кнопка активна только когда доставка посчитана
              onClick={() => setIsModalOpen(true)}
            >
              {createOrderMutation.isPending
                ? "Оформление..."
                : "Создать заказ и оплатить"}
            </button>
          </aside>
        </div>

        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmPayment}
          totalPrice={finalOrderPrice}
          items={legalSelectedItems}
        />
      </main>
    </>
  );
};
