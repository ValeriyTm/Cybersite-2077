//Роутер:
import { RouterProvider } from "react-router";
//Глобальная обработка ошибок (если проблемы на уровне приложения):
import { ErrorBoundary } from "react-error-boundary";
//React Query:
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//React DevTools:
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
//Google reCAPTCHA v3:
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
//Мой роутер:
import { router } from "./providers/router/config/router";
//Компонент, который отобразится при глобальной ошибке:
import { GlobalErrorFallback } from "@/shared/ui/GlobalErrorFallback/GlobalErrorFallback";
import "./styles/index.css"; //Подключаем тут глобальные стили

// Создаем клиент React Query:
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
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY}
    >
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          FallbackComponent={GlobalErrorFallback}
          onReset={() => (window.location.href = "/")} // Сброс: уводим на главную
        >
          <RouterProvider router={router} />
        </ErrorBoundary>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </GoogleReCaptchaProvider>
  );
};
