import { createBrowserRouter, Navigate } from "react-router";
//Клиентское хранилище:
import { useAuthStore } from "@/features/auth/model/auth-store";
//Компоненты:
import { AuthCard } from "@/features/auth/ui/AuthCard/AuthCard";
import { MainLayout } from "@/app/ui/MainLayout";
import { HomePage } from "@/pages/HomePage/HomePage";
import { ProfilePage } from "@/pages/ProfilePage/ProfilePage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage/ResetPasswordPage";
import { PrivacyPolicyPage } from "@/pages/Legal/PrivacyPolicyPage";
import { TermsPage } from "@/pages/Legal/TermsPage";
import { ErrorFallback } from "@/shared/ui/ErrorFallback/ErrorFallback";
import { ProtectedRoute } from "../ui/ProtectedRoute";
import { CatalogPage } from "@/pages/CatalogPage/CatalogPage";
import { BrandPage } from "@/pages/BrandPage/BrandPage";
import { MotorcyclesPage } from "@/pages/MotorcyclesPage/MotorcyclesPage";
import { MotorcycleDetailsPage } from "@/pages/MotorcycleDetailsPage/MotorcycleDetailsPage";

// Охранник для гостей (PublicOnly)
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((state) => state.isAuth);
  // Если залогинен — не пускаем на форму логина, отправляем в профиль
  return isAuth ? <Navigate to="/profile" replace /> : children;
};

export const router = createBrowserRouter([
  {
    element: <MainLayout />, //Задаем единый визуальны каркас для всех страниц
    errorElement: <ErrorFallback />, //Внутренняя обработка ошибок.  Если ошибка произойдет внутри любого компонента (например, в ProfilePage), React Router перехватит её первым. Он заменит содержимое страницы на ErrorFallback, но сохранит MainLayout (шапку, меню и футер).
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
      {
        path: "/catalog/motorcycles/:brandSlug/:slug",
        element: <MotorcycleDetailsPage />,
      },
      {
        path: "/catalog/motorcycles/:brandSlug",
        element: <MotorcyclesPage />,
      },
      {
        path: "/catalog/motorcycles",
        element: <BrandPage />,
      },
      {
        path: "/catalog",
        element: <CatalogPage />,
      },
      { path: "*", element: <div>404</div> },
    ],
  },
]);
