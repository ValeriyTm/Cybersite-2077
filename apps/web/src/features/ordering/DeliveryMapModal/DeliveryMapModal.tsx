// src/features/ordering/ui/DeliveryMapModal/DeliveryMapModal.tsx
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
import { useState } from "react";

// Фикс иконок Leaflet (стандартный баг при сборке)
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Иконка для складов (оранжевая)
const warehouseIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cloudflare.com",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface DeliveryMapModalProps {
  warehouses: any[];
  onSelect: (coords: { lat: number; lng: number }, address: string) => void;
  onClose: () => void;
  initialCoords: any;
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

  // Обработчик клика по карте
  const MapEvents = () => {
    useMapEvents({
      click: async (e) => {
        setTempCoords(e.latlng);
        setLoading(true);
        try {
          // Обратное геокодирование через Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=ru`,
            {
              headers: {
                //Nominatim просит указывать User-Agent (указываю название проекта)
                "User-Agent": "CyberSite-2077",
              },
            },
          );
          if (!res.ok) throw new Error("Ошибка сервера геокодинга");

          const data = await res.json();

          // Бывает, что Nominatim возвращает 200 OK, но с пустой ошибкой внутри
          if (data.error) throw new Error(data.error);

          //Ограничиваем зону выбора лишь границами РФ:
          if (data.address && data.address.country_code !== "ru") {
            setAddress("Доставка осуществляется только по территории РФ");
            setTempCoords(null); // Убираем метку, если она вне РФ
            return;
          }

          setAddress(data.display_name || "Адрес не найден");
          setTempCoords(e.latlng);
        } catch (err) {
          setAddress("Ошибка определения адреса");
        } finally {
          setLoading(false);
        }
      },
    });
    return null;
  };

  return (
    <div className="map-modal-overlay" style={modalOverlayStyle}>
      <div className="map-modal-content" style={modalContentStyle}>
        <h3>Выберите адрес доставки на карте</h3>

        <div
          style={{
            height: "500px",
            width: "100%",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={[55.75, 37.61]}
            zoom={4}
            attributionControl={false} //Убираем надпись в нижнем углу
            style={{ height: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Метки складов */}
            {warehouses.map((wh) => (
              <Marker
                key={wh.id}
                position={[wh.lat, wh.lng]}
                icon={warehouseIcon}
              >
                {/*Тултип при наведении:*/}
                <Tooltip direction="top" offset={[0, -32]} opacity={1}>
                  <span style={{ fontWeight: "bold", color: "#333" }}>
                    Склад: {wh.name}
                  </span>
                </Tooltip>

                {/*Попап при клике:*/}
                <Popup>Склад: {wh.name}</Popup>
              </Marker>
            ))}

            {/* Метка пользователя */}
            {tempCoords && <Marker position={tempCoords} />}

            <MapEvents />
          </MapContainer>
        </div>

        <div className="map-footer" style={{ marginTop: "20px" }}>
          <p>
            <strong>Адрес:</strong>{" "}
            {loading ? "Поиск..." : address || "Кликните на карту"}
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <button
              onClick={() =>
                tempCoords &&
                onSelect({ lat: tempCoords.lat, lng: tempCoords.lng }, address)
              }
              disabled={!tempCoords || loading}
              style={confirmBtnStyle}
            >
              Подтвердить адрес
            </button>
            <button onClick={onClose} style={cancelBtnStyle}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Инлайн-стили (лучше вынести в SCSS)
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.8)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalContentStyle: React.CSSProperties = {
  background: "#1a1a1a",
  padding: "20px",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "900px",
  color: "#fff",
};
const confirmBtnStyle = {
  background: "#f39c12",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};
const cancelBtnStyle = {
  background: "#333",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
};
