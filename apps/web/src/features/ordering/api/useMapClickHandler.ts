//Работа с картой:
import { useMapEvents } from "react-leaflet";

export const useMapClickHandler = (
  setTempCoords: (coords: L.LatLng | null) => void,
  setLoading: (loading: boolean) => void,
  setAddress: (address: string) => void,
) => {
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
      } catch (error) {
        setAddress("Ошибка определения адреса");
        console.log(`Ошибка ${error}`);
      } finally {
        setLoading(false);
      }
    },
  });
};

//Вспомогательный обертчик, который легально вызывает хук внутри контекста карты:
interface MapListenerProps {
  setTempCoords: (coords: L.LatLng | null) => void;
  setLoading: (loading: boolean) => void;
  setAddress: (address: string) => void;
}

export const MapListener = ({
  setTempCoords,
  setLoading,
  setAddress,
}: MapListenerProps) => {
  useMapClickHandler(setTempCoords, setLoading, setAddress);
  return null;
};
