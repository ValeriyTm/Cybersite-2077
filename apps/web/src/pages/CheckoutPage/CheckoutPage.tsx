//Роутинг:
import { useNavigate } from "react-router";
import { useLocation } from "react-router";
//Состояния:
import { CheckoutOrderPreview, useCalculateDelivery, useCreateOrder, useWarehouses } from "@/entities/ordering";
import { useProfile } from "@/features/auth";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { useEffect, useMemo, useState } from "react";
import { useTradingStore } from "@/entities/trading";
import { PaymentModal } from "@/widgets/PaymentModal";
import { DeliveryAddressSelector } from "@/features/ordering";
import { CheckoutSummary } from "@/widgets/CheckoutSummary";
//Типы:
import type { MotorcycleCart } from "@/entities/catalog";
import type { DeliveryInfo } from "@/entities/ordering/types/types";
//Стили:
import styles from "./CheckoutPage.module.scss";

export const CheckoutPage = () => {
  const { cartItems } = useTradingStore();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); //Состояние для pre-payment модалки:
  //Стейт для хранения ответа от "/api/warehouse/calculate":
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useProfile();
  const calculateMutation = useCalculateDelivery((data) => setDeliveryInfo(data));
  const createOrderMutation = useCreateOrder();

  //Информация о промокоде:
  const promoFromCart = location.state?.promo;
  //Информация, что  юзер попал на страницу /checkout именно с корзины:
  const isAllowed = location.state?.allowed;

  //Отбираем только выбранные юзером в корзине товары:
  const legalSelectedItems: MotorcycleCart[] = useMemo(
    () =>
      cartItems.filter(
        (item) =>
          item.selected &&
          item.quantity <= item.totalInStock &&
          item.totalInStock > 0,
      ),
    [cartItems],
  );

  //Получаем склады:
  const { data: warehouses, isError } = useWarehouses();

  // Флаг готовности остатков по товарам
  const hasStockData = useMemo(() => {
    return legalSelectedItems.length > 0 && legalSelectedItems.every(
      (item) => item.totalInStock != undefined,
    );
  }, [legalSelectedItems]);

  //Если пользователь вручную ввел адрес /checkout, но у него в корзине только «нелегальные» товары или вообще ничего не выбрано, его нужно выкинуть обратно в корзину:
  useEffect(() => {
    if (!isAllowed && legalSelectedItems.length === 0) {
      navigate("/cart");
    }
  }, [isAllowed, legalSelectedItems.length, navigate]);

  //Подставляем дефолтный адрес доставки из БД для юзера:
  useEffect(() => {
    if (address || coords) return; //Если адрес уже установлен — выходим
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


  const handleAddressSelect = (
    coords: { lat: number; lng: number },
    addr: string,
  ) => {
    setCoords(coords);
    setAddress(addr);

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
    createOrderMutation.mutate({
      items: legalSelectedItems.map((item) => ({
        id: item.id,
        model: item.model,
        price: item.discountData.finalPrice ?? item.price,
        quantity: item.quantity,
      })),
      address,
      coords,
      deliveryInfo: deliveryInfo!, //Защиту обеспечит блокировка кнопки при отсутствии адреса
      promoCode: promoFromCart?.code || null,
      totalPrice: finalOrderPrice,
      shouldPay,
    });
  };

  //Для модалки оплаты:
  const handleConfirmPayment = () => {
    setIsModalOpen(false);
    handleCreateOrder(true); // Вызываем мутацию с флагом shouldPay
  };

  if (isError) {
    return (
      <div className={styles.warehousesErrorMsg}>
        Ошибка при загрузке данных о доставке. Попробуйте позже.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Оформление заказа</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className={styles.CheckoutPage}>
        <h1 className={styles.title}>Оформление заказа</h1>

        <div className={styles.content}>
          {/*Левая часть - выбора адреса и превью заказа*/}
          <div className={styles.left}>
            {/*Блок 1 - адрес:*/}
            <DeliveryAddressSelector
              address={address}
              coords={coords}
              warehouses={warehouses || []}
              deliveryInfo={deliveryInfo}
              onAddressSelect={handleAddressSelect}
            />

            {/*Блок 2 - состав заказа:*/}
            <CheckoutOrderPreview items={legalSelectedItems} />
          </div>

          {/*Правая панель - итого:*/}
          <CheckoutSummary
            items={legalSelectedItems}
            deliveryInfo={deliveryInfo}
            promoFromCart={promoFromCart}
            finalOrderPrice={finalOrderPrice}
            itemsTotal={itemsTotal}
            isPending={createOrderMutation.isPending}
            onCreateOrder={handleCreateOrder}
            onOpenPaymentModal={() => setIsModalOpen(true)}
          />
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
