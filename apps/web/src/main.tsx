import { createRoot } from "react-dom/client";
//Главный компонент приложения, который будет рендериться в DOM:
import { App } from "./app/App";
//Стили:
import "leaflet/dist/leaflet.css"; //Стили для карты leaflet

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>
  //Отключил strict mode, т.к. библиотека focus trap с ним конфликтует (https://github.com/focus-trap/focus-trap-react)
);
