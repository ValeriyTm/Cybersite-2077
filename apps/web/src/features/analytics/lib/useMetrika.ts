import { useEffect } from "react";
import { useLocation } from "react-router";

export const useMetrika = () => {
  const location = useLocation();

  useEffect(() => {
    const metricaId = Number(import.meta.env.VITE_YANDEX_METRICA_ID);

    if (typeof (window as any).ym === "function") {
      // Сообщаем Яндексу о просмотре новой страницы
      (window as any).ym(metricaId, "hit", window.location.href);

      // Для отладки в dev-режиме (потом можно убрать)
      if (import.meta.env.DEV) {
        console.log(`[Metrika] Hit: ${window.location.href}`);
      }
    }
  }, [location]);
};
