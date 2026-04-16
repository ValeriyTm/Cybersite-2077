import { useEffect } from "react";
//Библиотека всплывающих уведомлений:
import { Toaster } from "react-hot-toast";
//Роутер:
import { Outlet } from "react-router";
//Данные пользователя:
import { useProfile } from "@/features/auth/model/useProfile";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
//Работа с избранным:
import { useFavorites } from "@/entities/trading/api/useFavorites";
//Работа с корзиной:
import { useCart } from "@/entities/trading/api/useCart";
//Виджеты:
import { Header } from "@/widgets/Header/ui/Header";
import { Footer } from "@/widgets/Footer/ui/Footer";
//Прочие компоненты:
import { PageLoader } from "@/pages/PageLoader";
import { CursorTrail } from "@/shared/ui/CursorTrail";
import { useThemeStore } from "@/entities/session/model/themeStore";
import { MobileMenu } from "@/widgets/MobileMenu/MobileMenu";

export const MainLayout = () => {
  const { isLoading, isError } = useProfile();   //Хук useProfile сам инициирует запрос и вернет актуальный статус загрузки:
  const isAuth = useAuthStore((state) => state.isAuth);   //Статус авторизации

  const theme = useThemeStore((state) => state.theme); //Получаем текущую тему


  useFavorites(); //Чтобы список избранных товаров подгружался сразу при старте приложения:
  useCart(); //Чтобы список товаров в корзине подгружался сразу при старте приложения:

  useEffect(() => {
    //Гарантируем, что класс на body всегда соответствует стору:
    document.body.className = theme;
  }, [theme]);


  //Если авторизован и идёт загрузка, то покажем универсальный лоадер для всех страниц:
  if (isAuth && isLoading) {
    return <PageLoader />
  }

  return (
    <>
      <Toaster
        position="top-center" //Позиционируем всплывающее уведомление
        reverseOrder={false} //Определяем порядок появления (при false новые уведомления будут появляться поверх старых)
        toastOptions={{
          duration: 3000, //Длительность отображения уведомления
          style: {
            background: "#333", //Фон уведомления
            color: "#fff", //Текст уведомления
          },
        }}
      />

      {/* <CursorTrail /> */}
      <Header />
      <MobileMenu />

      {/*Основной контент страницы:*/}
      <main className="content-wrapper">
        <Outlet />
      </main>

      <Footer />
    </>
  );
};
