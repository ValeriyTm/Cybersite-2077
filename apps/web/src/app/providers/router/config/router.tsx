import { createBrowserRouter, Navigate } from "react-router";
import { AuthCard } from "@/features/auth/ui/AuthCard/AuthCard";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { MainLayout } from "@/app/ui/MainLayout";
import { HomePage } from "@/pages/HomePage/HomePage";
import { ProfilePage } from "@/pages/ProfilePage/ProfilePage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage/ResetPasswordPage";
import { PrivacyPolicyPage } from "@/pages/Legal/PrivacyPolicyPage";
import { TermsPage } from "@/pages/Legal/TermsPage";
import { ErrorFallback } from "@/shared/ui/ErrorFallback/ErrorFallback";

//Компонент-обертка, который ограничивает доступ к определенным страницам приложения в зависимости от статуса авторизации пользователя.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  //Извлекаем статус авторизации из глобального состояния с помощью хука useAuthStore:
  const isAuth = useAuthStore((state) => state.isAuth);
  // Если пользователь не авторизован, перенаправляем его на страницу /auth:
  return isAuth ? children : <Navigate to="/auth" replace />;
};

// Охранник для гостей (PublicOnly)
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((state) => state.isAuth);
  // Если залогинен — не пускаем на форму логина, отправляем в профиль
  return isAuth ? <Navigate to="/profile" replace /> : children;
};

export const router = createBrowserRouter([
  {
    element: <MainLayout />, // Теперь проверка авторизации будет на ВСЕХ страницах
    errorElement: <ErrorFallback />, //Внутренняя обработка ошибок.  Если ошибка произойдет внутри любого компонента (например, в ProfilePage), React Router перехватит её первым. Он заменит содержимое страницы на ErrorFallback, но сохранит MainLayout (твою шапку, меню и футер).
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/privacy", element: <PrivacyPolicyPage /> },
      { path: "/terms", element: <TermsPage /> },
      {
        path: "/auth",
        element: (
          <GuestRoute>
            <AuthCard />
          </GuestRoute>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        ),
      },
      {
        path: "/reset-password",
        element: (
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <div>404</div> },
    ],
  },
]);
