import { lazy } from 'react';
//Роутинг:
import { createBrowserRouter } from "react-router";
//Компоненты:
import { HomePage } from '@/pages/HomePage';
import { MainLayout } from "@/app/ui/";
import { ErrorFallback } from "@/shared/ui";
import { ProtectedRoute } from '@/app/providers/router/ui/ProtectedRoute.js';
import { GuestRoute } from '@/app/providers/router/ui/GuestRout.js';

const ProfilePage = lazy(() => import("@/pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const AuthCard = lazy(() => import("@/features/auth/ui").then(m => ({ default: m.AuthCard })));

export const router = createBrowserRouter([
  {
    element: <MainLayout />, //Задаем единый визуальный каркас для всех страниц
    errorElement: <ErrorFallback />, //Внутренняя обработка ошибок.  Если ошибка произойдет внутри любого компонента (например, в ProfilePage), React Router перехватит её первым. Он заменит содержимое страницы на ErrorFallback, но сохранит MainLayout (шапку, меню и футер).
    children: [
      { path: "/", element: <HomePage /> }, //Домашняя страница
      { path: "/privacy", lazy: () => import("@/pages/Legal").then(m => ({ Component: m.PrivacyPolicyPage })) }, //Страница политики конфиденциальности
      { path: "/terms", lazy: () => import("@/pages/Legal").then(m => ({ Component: m.TermsPage })), }, //Страница согласия на обработку персональных данных
      { path: "/agreement", lazy: () => import("@/pages/Legal").then(m => ({ Component: m.UserAgreement })), },  //Страница пользовательского соглашения
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
        lazy: () => import("@/pages/FavoritesPage").then(m => ({ Component: m.FavoritesPage })),
        //Страница избранных товаров
      },
      {
        path: "/about",
        lazy: () => import("@/pages/AboutPage").then(m => ({ Component: m.AboutPage })),
        //Страница "О нас"
      },
      {
        path: "/contacts",
        lazy: () => import("@/pages/ContactsPage").then(m => ({ Component: m.ContactsPage })),
        //Страница "Контакты"
      },
      {
        path: "/catalog/motorcycles/:brandSlug/:slug",
        lazy: () => import("@/pages/MotorcycleDetailsPage").then(m => ({ Component: m.MotorcycleDetailsPage })),
        //Страница конкретного мотоцикла
      },
      {
        path: "/catalog/motorcycles/:brandSlug",
        lazy: () => import("@/pages/MotorcyclesPage").then(m => ({ Component: m.MotorcyclesPage })),
        //Страница мотоциклов конкретного бренда
      },
      {
        path: "/catalog/motorcycles",
        lazy: () => import("@/pages/BrandPage").then(m => ({ Component: m.BrandPage })),
        //Страница всех брендов
      },
      {
        path: "/catalog",
        lazy: () => import("@/pages/CatalogPage").then(m => ({ Component: m.CatalogPage })),
        //Страница каталога
      },
      {
        path: "/cart",
        lazy: () => import("@/pages/CartPage").then(m => ({ Component: m.CartPage })),
        //Страница корзины
      },
      {
        path: "/checkout",
        lazy: () => import("@/pages/CheckoutPage").then(m => ({ Component: m.CheckoutPage })),
        //Страница создания заказа
      },
      {
        path: "/orders/my",
        lazy: () => import("@/pages/MyOrdersPage").then(m => ({ Component: m.MyOrdersPage })),
        //Страница заказов
      },
      {
        path: "/promos",
        lazy: () => import("@/pages/PromosPage").then(m => ({ Component: m.PromosPage })),
        //Страница с промокодами
      },
      {
        path: "/news",
        children: [
          {
            index: true,
            lazy: () => import("@/pages/NewsPage").then(m => ({ Component: m.NewsPage })),
            //Страница всех новостей
          },
          {
            path: ":slug",
            lazy: () => import("@/pages/NewsDetailsPage").then(m => ({ Component: m.NewsDetailsPage })),
            //Страница конкретной новости
          },
        ],
      },
      {
        path: "/support",
        lazy: () => import("@/pages/SupportPage").then(m => ({ Component: m.SupportPage })),
        //Страница поддержки
      },
      {
        path: "/support/tickets",
        lazy: () => import("@/pages/UserTicketsPage").then(m => ({ Component: m.UserTicketsPage })),
        //Страница с пользовательскими вопросами
      },
      {
        path: "/admin",
        lazy: () => import("@/app/providers/router/ui/AdminRoute.js").then(m => ({ Component: m.AdminRoute })),
        // element: <AdminRoute />, //Админ-панель
        children: [
          {
            path: "", // Базовый путь 
            lazy: () => import("@/widgets/AdminLayout").then(m => ({ Component: m.AdminLayout })),
            // element: <AdminLayout />, // Если права есть — показываем сайдбар
            children: [
              {
                path: "brands",
                lazy: () => import("@/pages/AdminBrandsPage").then(m => ({ Component: m.AdminBrandsPage })),
                //Страница работы с брендами мотоциклов
              },
              {
                path: "motorcycles",
                lazy: () => import("@/pages/AdminMotorcyclesPage").then(m => ({ Component: m.AdminMotorcyclesPage })),
                //Страница работы с позициями мотоциклов
              },
              {
                path: "stocks",
                lazy: () => import("@/pages/AdminStocksPage").then(m => ({ Component: m.AdminStocksPage })),
                //Страница работы с остатками на складах

              },
              {
                path: "orders",
                lazy: () => import("@/pages/AdminOrdersPage").then(m => ({ Component: m.AdminOrdersPage })),
                //Страница работы с заказами
              },
              {
                path: "tickets",
                lazy: () => import("@/pages/AdminTicketsPage").then(m => ({ Component: m.AdminTicketsPage })),
                //Страница работы с обращениями клиентов
              },
              {
                path: "reports",
                lazy: () => import("@/pages/AdminReportsPage").then(m => ({ Component: m.AdminReportsPage })),
                //Страница работы с отчетами
              },
              {
                path: "discounts",
                lazy: () => import("@/pages/AdminDiscountsPage").then(m => ({ Component: m.AdminDiscountsPage })),
                //Страница работы с промокодами и скидками
              },
              {
                path: "users",
                lazy: () => import("@/pages/AdminUsersPage").then(m => ({ Component: m.AdminUsersPage })),
                //Страница работы с пользователями приложения
              },
              {
                path: "stats",
                lazy: () => import("@/pages/AdminStatsPage").then(m => ({ Component: m.AdminStatsPage })),
                //Страница работы с технической частью приложения
              },
              {
                path: "news",
                lazy: () => import("@/pages/AdminNewsPage").then(m => ({ Component: m.AdminNewsPage })),
                //Страница работы с контентом
              },
            ],
          },
        ],
      },

      {
        path: "*",
        lazy: () => import("@/pages/NotFoundPage").then(m => ({ Component: m.NotFoundPage })),
        //404 страница
      },
    ],
  },
]);
