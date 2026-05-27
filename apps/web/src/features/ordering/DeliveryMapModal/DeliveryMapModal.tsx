import { useState } from "react";
//Работа с картой:
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
//Типы:
import type { Warehouse } from "@repo/database/generated/prisma/client";
//Стили:
import styles from './DeliveryMapModal.module.scss';
import { Button } from "@/shared/ui";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

//Иконка для складов (оранжевая):
const warehouseIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cloudflare.com",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface DeliveryMapModalProps {
  warehouses: Warehouse[];
  onSelect: (coords: { lat: number; lng: number }, address: string) => void;
  onClose: () => void;
  initialCoords: { lat: number; lng: number } | null;
}

export const DeliveryMapModal = ({
  warehouses,
  onSelect,
  onClose,
  initialCoords,
}: DeliveryMapModalProps) => {
  const [tempCoords, setTempCoords] = useState<L.LatLng | null>(
    initialCoords ? L.latLng(initialCoords.lat, initialCoords.lng) : null,
  );
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  //Обработчик клика по карте:
  const MapEvents = () => {
    useMapEvents({
      click: async (e) => {
        setTempCoords(e.latlng);
        setLoading(true);
        try {
          //Обратное геокодирование через Nominatim (получаем адрес по координатам):
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=ru`,
            {
              headers: {
                //Nominatim просит указывать User-Agent (указываю название проекта):
                "User-Agent": "CyberSite-2077",
              },
            },
          );
          if (!res.ok) throw new Error("Ошибка сервера геокодинга");

          const data = await res.json();

          //Бывает, что Nominatim возвращает 200 OK, но с пустой ошибкой внутри:
          if (data.error) throw new Error(data.error);

          //Ограничиваем зону выбора лишь границами РФ:
          if (data.address && data.address.country_code !== "ru") {
            setAddress("Доставка осуществляется только по территории РФ");
            setTempCoords(null); //Убираем метку, если она вне РФ
            return;
          }

          setAddress(data.display_name || "Адрес не найден");
          setTempCoords(e.latlng);
        } catch (err) {
          setAddress("Ошибка определения адреса");
          console.log(`Ошибка определения адреса: ${err}`)
        } finally {
          setLoading(false);
        }
      },
    });
    return null;
  };

  return (
    <div className={`"map-modal-overlay" ${styles.modalOverlayStyle}`}>
      <div className={`"map-modal-content" ${styles.modalContentStyle}`}>
        <h3>Выберите адрес доставки на карте</h3>
        <div className={styles.mapBasic}>
          <MapContainer
            center={[55.75, 37.61]}
            zoom={4}
            attributionControl={false} //Убираем надпись в нижнем углу
            className={styles.mapContainer}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/*Метки складов:*/}
            {warehouses.map((wh) => (
              <Marker
                key={wh.id}
                position={[wh.lat, wh.lng]}
                icon={warehouseIcon}
              >
                {/*Тултип при наведении:*/}
                <Tooltip direction="top" offset={[0, -32]} opacity={1}>
                  <span>
                    Склад: {wh.name}
                  </span>
                </Tooltip>

                {/*Попап при клике:*/}
                <Popup>Склад: {wh.name}</Popup>
              </Marker>
            ))}

            {/*Метка пользователя: */}
            {tempCoords && <Marker position={tempCoords} />}

            <MapEvents />
          </MapContainer>
        </div>

        <div className={styles.mapFooter}>
          <p>
            <strong>Адрес:</strong>{" "}
            {loading ? "Поиск..." : address || "Кликните на карту"}
          </p>

          <div className={styles.btnGroup}>
            <div className={styles.btnWrapper}>
              <Button type="button" disabled={!tempCoords || loading} variant="primary" onClick={() =>
                tempCoords &&
                onSelect({ lat: tempCoords.lat, lng: tempCoords.lng }, address)}>
                Подтвердить адрес
              </Button>
            </div>
            <div className={styles.btnWrapper}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

