import { RouterProvider } from "react-router";
import { router } from "./providers/router/config/router";
import "./styles/index.css"; //Подключаем тут глобальные стили

export const App = () => {
  return <RouterProvider router={router} />;
};
