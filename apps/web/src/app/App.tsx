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
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { usePrivacyStore } from "@/entities/session";
//Страницы:
import { PageLoader } from "@/pages/PageLoader";
import { PrivacyPage } from "@/pages/PrivacyPage";
//API:
import axios from "axios";
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
  const isAccepted = usePrivacyStore((state) => state.isAccepted);
  //Не использовал деструктуризацию во избежание лишних ререндеров в компоненте такого высокого уровня

  const [isCheckingAuth, setIsCheckingAuth] = useState(() => isAuth && !accessToken);

  useEffect(() => {
    // Если пользователь еще не принял условия политики, то проверку авторизациине не проводим:
    if (!isAccepted) {
      return;
    }

    //Если по данным localStorage юзер залогинен, но токена в памяти нет (была перезагрузка F5):
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
  }, [accessToken, clearAuth, isAuth, setAuth, isAccepted]);

  //Если нет согласия, то рендерится только модалка:
  if (!isAccepted) {
    return <PrivacyPage />;
  }

  //Если согласие есть, но идет проверка токена, то показывается лоадер:
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

