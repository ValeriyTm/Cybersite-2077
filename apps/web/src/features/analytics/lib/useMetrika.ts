import { useEffect } from "react";
import { useLocation } from "react-router";

export const useMetrika = () => {
  const location = useLocation();

  useEffect(() => {
    const metricaId = Number(import.meta.env.VITE_YANDEX_METRICA_ID);

    if (typeof window.ym === "function") {
      // Сообщаем Яндексу о просмотре новой страницы:
      window.ym(metricaId, "hit", window.location.href);
    }
  }, [location]);
};
