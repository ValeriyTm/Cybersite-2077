import { RouterProvider } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { router } from "./providers/router/config/router";
import { GlobalErrorFallback } from "@/shared/ui/GlobalErrorFallback/GlobalErrorFallback";
import "./styles/index.css"; //Подключаем тут глобальные стили

// Создаем клиент (настройки по умолчанию)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Если запрос упал, пробуем еще 1 раз
      refetchOnWindowFocus: false, // Отключим авто-обновление при смене вкладок для разработки
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        FallbackComponent={GlobalErrorFallback}
        onReset={() => (window.location.href = "/")} // Сброс: уводим на главную
      >
        <RouterProvider router={router} />
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
