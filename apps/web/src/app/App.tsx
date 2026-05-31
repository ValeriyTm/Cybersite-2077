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
//Состояние:
import { useAuthStore } from "@/features/auth";
import { useEffect, useState } from "react";
//Страницы:
import { PageLoader } from "@/pages/PageLoader";
//API:
import axios from "axios";
//Логирование:
import * as Sentry from "@sentry/react";
//React Helmet для SEO:
import { HelmetProvider } from "react-helmet-async";
//Компонент, который отобразится при глобальной ошибке:
import { GlobalErrorFallback } from "@/shared/ui";
//Глобальные стили:
import "./styles/index.scss";


//Клиент React Query:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, //Если запрос упал, пробуем еще 1 раз
      refetchOnWindowFocus: !import.meta.env.DEV, //Отключаем авто-обновление при смене вкладок для разработки
    },
  },
});

export const App = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  //Не использовал деструктуризацию во избежание лишних ререндеров в компоненте такого высокого уровня

  const [isCheckingAuth, setIsCheckingAuth] = useState(() => isAuth && !accessToken);

  useEffect(() => {
    //Если по данным localStorage юзер залогинен, но токена в памяти нет (была перезагрузка):
    if (isAuth && !accessToken) {
      axios
        .post(`${import.meta.env.VITE_API_URL}/api/identity/auth/refresh`, {}, { withCredentials: true })
        .then((res) => {
          setAuth(res.data.accessToken);
        })
        .catch(() => {
          clearAuth(); // Если кука просрочена — разлогиниваем
        })
        .finally(() => {
          setIsCheckingAuth(false);
        });
    }
  }, [accessToken, clearAuth, isAuth, setAuth]);

  if (isCheckingAuth) {
    return (
      <PageLoader />
    );
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY}
    >
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ErrorBoundary
            FallbackComponent={GlobalErrorFallback}
            //Логируем ошибку сразу в момент возникновения
            onError={(error, info) => {
              Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
            }}
            //Сбрасываем состояние при нажатии кнопки в Fallback:
            onReset={() => {
              queryClient.clear(); //Очищаем кэш запросов перед редиректом
              setTimeout(() => {
                window.location.href = "/";
              }, 150); //Небольшой таймаут гарантирует, что сетевой пакет Sentry успеет улететь
            }}
          >
            <RouterProvider router={router} />
          </ErrorBoundary>
        </HelmetProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </GoogleReCaptchaProvider>
  );
};

