import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import styles from './ContactsMap.module.scss';

const customIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export const ContactsMap = () => {
    const position: [number, number] = [56.0202, 92.7990];

    return (
        <div className={styles.mapWrapper}>
            <MapContainer
                center={position}
                zoom={14}
                attributionControl={false} //Убираем надпись в нижнем углу
                scrollWheelZoom={true}
                className={styles.container}
            >

                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={position} icon={customIcon}>
                    {/*Тултип при наведении:*/}
                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                        <span style={{ fontWeight: "bold", color: "#333" }}>
                            Главный салон CyberMoto-2077
                        </span>
                    </Tooltip>
                    <Popup>
                        <div className={styles.popup}>
                            <strong>CyberMoto-2077</strong> <br />
                            Красноярск, ул. Кибернетическая, 2077
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};
