// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//Сбор логов:
import * as Sentry from "@sentry/react";
//Главный компонент приложения, который будет рендериться в DOM:
import { App } from "./app/App";
//Стили:
import "leaflet/dist/leaflet.css"; //Стили для карты leaflet

//Инициализируем Sentry:
Sentry.init({
  dsn: "https://b44d6de4137905503cadc4ef8f0efbc9@o4511443256213504.ingest.de.sentry.io/4511443266371664",

  integrations: [
    Sentry.browserTracingIntegration(),
  ],

  // Настройка сбора метрик производительности: в режиме разработки (DEV) пишем 100% данных, на продакшене снижаем до 20% для экономии лимитов
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,

  // Отключаем отправку ошибок во время локальной разработки, чтобы не тратить бесплатный лимит в 5000 ошибок
  enabled: !import.meta.env.DEV,
});

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>
);
