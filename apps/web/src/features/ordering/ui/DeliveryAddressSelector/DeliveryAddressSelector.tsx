import { useState } from "react";
//Компоненты:
import { Button } from "@/shared/ui";
import { DeliveryMapModal } from "../DeliveryMapModal";
//Типы:
import type { Warehouse } from "@repo/database/generated/prisma/client";
//Стили:
import styles from "./DeliveryAddressSelector.module.scss";

interface DeliveryAddressSelectorProps {
  address: string;
  coords: { lat: number; lng: number } | null;
  warehouses: Warehouse[];
  deliveryInfo: {
    estimatedDate: string;
    warehouse: { name: string };
  } | null;
  onAddressSelect: (coords: { lat: number; lng: number }, addr: string) => void;
}

export const DeliveryAddressSelector = ({
  address,
  coords,
  warehouses,
  deliveryInfo,
  onAddressSelect,
}: DeliveryAddressSelectorProps) => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <section className={styles.section}>
      <h3>1. Адрес доставки</h3>
      <div className={styles.addressBox}>
        {address ? (
          <>
            <p className={styles.currentAddress}>📍 {address}</p>
            <Button type="button" variant="outline-dark" onClick={() => setIsMapOpen(true)}>
              Изменить адрес доставки
            </Button>
          </>
        ) : (
          <Button type="button" variant="primary" onClick={() => setIsMapOpen(true)}>
            Выбрать адрес на карте
          </Button>
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

      {isMapOpen && (
        <DeliveryMapModal
          warehouses={warehouses || []}
          initialCoords={coords} //Передаем дефолтные координаты адреса доставки для юзера (из БД юзера)
          onSelect={(c, a) => {
            onAddressSelect(c, a);
            setIsMapOpen(false);
          }}
          onClose={() => setIsMapOpen(false)}
        />
      )}
    </section>
  );
};
