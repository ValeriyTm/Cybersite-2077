//Роутинг:
import { createBrowserRouter, Navigate } from "react-router";
//Данные пользователя:
import { useAuthStore } from "@/features/auth/model/useAuthStore";
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
import { FavoritesPage } from "@/pages/FavoritesPage/FavotiresPage";
import { CartPage } from "@/pages/CartPage/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage/CheckoutPage";
import { MyOrdersPage } from "@/pages/MyOrdersPage/MyOrdersPage";
import { PromosPage } from "@/pages/PromosPage/PromosPage";
import { PaymentSuccess } from "@/pages/PaymentStatus/PaymentSuccess";
import { PaymentFail } from "@/pages/PaymentStatus/PaymentFail";
import { SupportPage } from "@/pages/SupportPage/SupportPage";
import { UserTicketsPage } from "@/pages/UserTicketsPage/UserTicketsPage";
import { NotFoundPage } from "@/pages/NotFoundPage/NotFoundPage";
import { UserAgreement } from "@/pages/Legal/UserAgreement";
import { AdminRoute } from "../ui/AdminRoute";
import { AdminLayout } from "@/widgets/AdminLayout/ui/AdminLayout";
import { AdminBrandsPage } from "@/pages/AdminBrandsPage/ui/AdminBrandsPage";
import { AdminMotorcyclesPage } from "@/pages/AdminMotorcyclesPage/ui/AdminMotorcyclesPage";
import { AdminStocksPage } from "@/pages/AdminStocksPage/ui/AdminStocksPage";
import { AdminOrdersPage } from "@/pages/AdminOrdersPage/ui/AdminOrdersPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage/ui/AdminUsersPage";
import { AdminStatsPage } from "@/pages/AdminStatsPage/ui/AdminStatsPage";
import { AdminDiscountsPage } from "@/pages/AdminDiscountsPage/ui/AdminDiscountsPage";
import { AdminReportsPage } from "@/pages/AdminReportsPage/ui/AdminReportsPage";
import { AdminTicketsPage } from "@/pages/AdminTicketsPage/ui/AdminTicketsPage";
import { AdminNewsPage } from "@/pages/AdminNewsPage.tsx/ui/AdminNewsPage";
import { NewsPage } from "@/pages/NewsPage/ui/NewsPage";
import { NewsDetailsPage } from "@/pages/NewsDetailsPage/NewsDetailsPage";
import { AboutPage } from "@/pages/AboutPage";
import { ContactsPage } from "@/pages/ContactsPage";

//Публичный маршрут:
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((state) => state.isAuth);
  //Если юзер залогинен, то не пускаем его на форму логина, а отправляем в профиль:
  return isAuth ? <Navigate to="/profile" replace /> : children;
};

export const router = createBrowserRouter([
  {
    element: <MainLayout />, //Задаем единый визуальный каркас для всех страниц
    errorElement: <ErrorFallback />, //Внутренняя обработка ошибок.  Если ошибка произойдет внутри любого компонента (например, в ProfilePage), React Router перехватит её первым. Он заменит содержимое страницы на ErrorFallback, но сохранит MainLayout (шапку, меню и футер).
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/privacy", element: <PrivacyPolicyPage /> },
      { path: "/terms", element: <TermsPage /> },
      { path: "/agreement", element: <UserAgreement /> },
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
        path: "/profile/favorites",
        element: <FavoritesPage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/contacts",
        element: <ContactsPage />,
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
      {
        path: "/cart",
        element: <CartPage />, //Страница корзины
      },
      {
        path: "/checkout",
        element: <CheckoutPage />, //Страница создания заказа
      },
      {
        path: "/orders/my",
        element: <MyOrdersPage />, //Страница заказов
      },
      {
        path: "/promos",
        element: <PromosPage />, //Страница с промокодами
      },
      {
        path: "/payment/success",
        element: <PaymentSuccess />, //Страница успешной оплаты (пока не используется)
      },
      {
        path: "/payment/fail",
        element: <PaymentFail />, //Страница неудачной оплаты (пока не используется)
      },
      {
        path: "/news",
        children: [
          {
            index: true, // Путь /news
            element: <NewsPage />,
          },
          {
            path: ":slug", // Путь /news/honda-cbr-review
            element: <NewsDetailsPage />,
          },
        ],
      },
      {
        path: "/support",
        element: <SupportPage />, //Страница поддержки
      },
      {
        path: "/support/tickets",
        element: <UserTicketsPage />, //Страница с пользовательскими вопросами
      },
      {
        path: "/admin",
        element: <AdminRoute />,
        children: [
          {
            path: "", // Базовый путь 
            element: <AdminLayout />, // Если права есть — показываем сайдбар
            children: [
              {
                path: "brands",
                element: <AdminBrandsPage />,
              },
              {
                path: "motorcycles",
                element: <AdminMotorcyclesPage />,
              },
              {
                path: "stocks",
                element: <AdminStocksPage />,

              },
              {
                path: "orders",
                element: <AdminOrdersPage />,
              },
              {
                path: "tickets",
                element: <AdminTicketsPage />,
              },
              {
                path: "reports",
                element: <AdminReportsPage />,
              },
              {
                path: "discounts",
                element: <AdminDiscountsPage />,
              },
              {
                path: "users",
                element: <AdminUsersPage />,
              },
              {
                path: "stats",
                element: <AdminStatsPage />,
              },
              {
                path: "news",
                element: <AdminNewsPage />,
              },
            ],
          },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
