//Роутинг:
import { RouterProvider } from "react-router";
import { router } from "./providers/router/config/router";
//Глобальная обработка ошибок (если проблемы на уровне приложения):
import { ErrorBoundary } from "react-error-boundary";
//React Query:
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//React DevTools:
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
//Google reCAPTCHA v3:
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
//React Helmet для SEO:
import { HelmetProvider } from "react-helmet-async";
//Компонент, который отобразится при глобальной ошибке:
import { GlobalErrorFallback } from "@/shared/ui";
//Глобальные стили:
import "./styles/index.scss";

// Создаем клиент React Query:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, //Если запрос упал, пробуем еще 1 раз
      refetchOnWindowFocus: false, //Отключаем авто-обновление при смене вкладок для разработки
    },
  },
});

export const App = () => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY}
    >
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ErrorBoundary
            FallbackComponent={GlobalErrorFallback}
            onReset={() => (window.location.href = "/")} //Редирект на главную
          >
            <RouterProvider router={router} />
          </ErrorBoundary>
        </HelmetProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </GoogleReCaptchaProvider>
  );
};
