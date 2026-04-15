// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//Наш главный компонент приложения, который будет рендериться в DOM:
import { App } from "./app/App";
// import "@/app/styles/index.css";
import "leaflet/dist/leaflet.css"; //Стили для leaflet

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>
);
