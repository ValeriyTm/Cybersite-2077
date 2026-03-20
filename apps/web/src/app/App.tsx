import { RouterProvider } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { router } from "./providers/router/config/router";
import { GlobalErrorFallback } from "@/shared/ui/GlobalErrorFallback/GlobalErrorFallback";
import "./styles/index.css"; //Подключаем тут глобальные стили

export const App = () => {
  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onReset={() => (window.location.href = "/")} // Сброс: уводим на главную
    >
      <RouterProvider router={router} />
    </ErrorBoundary>
    //Тут глобальная обработка ошибок. Это аварийный выход, который просто сбросит всё приложение.
  );
};
