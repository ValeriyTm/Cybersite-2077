//Роутинг:
import { createBrowserRouter, Navigate } from "react-router";
//Состояния:
import { useAuthStore } from "@/features/auth/model/useAuthStore";
//Компоненты:
import { AuthCard } from "@/features/auth/ui/AuthCard/AuthCard";
import { MainLayout } from "@/app/ui/";
import { HomePage } from "@/pages/HomePage/HomePage";
import { ProfilePage } from "@/pages/ProfilePage/ProfilePage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage/ResetPasswordPage";
import { PrivacyPolicyPage } from "@/pages/Legal/PrivacyPolicyPage";
import { TermsPage } from "@/pages/Legal/TermsPage";
import { UserAgreement } from "@/pages/Legal/UserAgreement";
import { AboutPage } from "@/pages/AboutPage";
import { ContactsPage } from "@/pages/ContactsPage";
import { ErrorFallback } from "@/shared/ui/ErrorFallback/ErrorFallback";
import { ProtectedRoute } from "../ui/";
import { CatalogPage } from "@/pages/CatalogPage/CatalogPage";
import { BrandPage } from "@/pages/BrandPage/BrandPage";
import { MotorcyclesPage } from "@/pages/MotorcyclesPage/MotorcyclesPage";
import { MotorcycleDetailsPage } from "@/pages/MotorcycleDetailsPage/MotorcycleDetailsPage";
import { FavoritesPage } from "@/pages/FavoritesPage/FavotiresPage";
import { CartPage } from "@/pages/CartPage/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage/CheckoutPage";
import { MyOrdersPage } from "@/pages/MyOrdersPage/MyOrdersPage";
import { PromosPage } from "@/pages/PromosPage/PromosPage";
import { SupportPage } from "@/pages/SupportPage/SupportPage";
import { UserTicketsPage } from "@/pages/UserTicketsPage/UserTicketsPage";
import { NotFoundPage } from "@/pages/NotFoundPage/NotFoundPage";
import { NewsPage } from "@/pages/NewsPage/ui/NewsPage";
import { NewsDetailsPage } from "@/pages/NewsDetailsPage/NewsDetailsPage";
import { AdminRoute } from "../ui/";
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
      { path: "/", element: <HomePage /> }, //Домашняя страница
      { path: "/privacy", element: <PrivacyPolicyPage /> }, //Страница политики конфиденциальности
      { path: "/terms", element: <TermsPage /> }, //Страница согласия на обработку персональных данных
      { path: "/agreement", element: <UserAgreement /> },  //Страница пользовательского соглашения
      {
        path: "/auth",
        element: (
          <GuestRoute>
            <AuthCard />
          </GuestRoute> //Страница авторизации
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute> //Страница "Forgot Password"
        ),
      },
      {
        path: "/reset-password",
        element: (
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute> //Страница восстановления пароля
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute> //Страница профиля
        ),
      },
      {
        path: "/profile/favorites",
        element: <FavoritesPage />, //Страница избранных товаров
      },
      {
        path: "/about",
        element: <AboutPage />, //Страница "О нас"
      },
      {
        path: "/contacts",
        element: <ContactsPage />, //Страница "Контакты"
      },
      {
        path: "/catalog/motorcycles/:brandSlug/:slug",
        element: <MotorcycleDetailsPage />, //Страница конкретного мотоцикла
      },
      {
        path: "/catalog/motorcycles/:brandSlug",
        element: <MotorcyclesPage />, //Страница мотоциклов конкретного бренда
      },
      {
        path: "/catalog/motorcycles",
        element: <BrandPage />, //Страница всех брендов
      },
      {
        path: "/catalog",
        element: <CatalogPage />, //Страница каталога
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
        path: "/news",
        children: [
          {
            index: true,
            element: <NewsPage />, //Страница всех новостей
          },
          {
            path: ":slug",
            element: <NewsDetailsPage />, //Страница конкретной новости
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
        element: <AdminRoute />, //Админ-панель
        children: [
          {
            path: "", // Базовый путь 
            element: <AdminLayout />, // Если права есть — показываем сайдбар
            children: [
              {
                path: "brands",
                element: <AdminBrandsPage />, //Страница работы с брендами мотоциклов
              },
              {
                path: "motorcycles",
                element: <AdminMotorcyclesPage />, //Страница работы с позициями мотоциклов
              },
              {
                path: "stocks",
                element: <AdminStocksPage />, //Страница работы с остатками на складах

              },
              {
                path: "orders",
                element: <AdminOrdersPage />, //Страница работы с заказами
              },
              {
                path: "tickets",
                element: <AdminTicketsPage />, //Страница работы с обращениями клиентов
              },
              {
                path: "reports",
                element: <AdminReportsPage />, //Страница работы с отчетами
              },
              {
                path: "discounts",
                element: <AdminDiscountsPage />, //Страница работы с промокодами и скидками
              },
              {
                path: "users",
                element: <AdminUsersPage />, //Страница работы с пользователями приложения
              },
              {
                path: "stats",
                element: <AdminStatsPage />, //Страница работы с технической частью приложения
              },
              {
                path: "news",
                element: <AdminNewsPage />, //Страница работы с контентом
              },
            ],
          },
        ],
      },

      { path: "*", element: <NotFoundPage /> }, //404 страница
    ],
  },
]);
