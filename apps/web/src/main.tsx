// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//Главный компонент приложения, который будет рендериться в DOM:
import { App } from "./app/App";
//Стили:
import "leaflet/dist/leaflet.css"; //Стили для leaflet

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>
);
