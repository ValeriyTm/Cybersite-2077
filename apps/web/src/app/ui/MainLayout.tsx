import { useEffect } from "react";
//Роутер:
import { Outlet } from "react-router";
//Состояния:
import { useProfile } from "@/features/auth/model/useProfile";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { useFavorites } from "@/entities/trading/api/useFavorites";
import { useCart } from "@/entities/trading/api/useCart";
//Компоненты:
import { Header } from "@/widgets/Header/ui/Header";
import { Footer } from "@/widgets/Footer/ui/Footer";
import { PageLoader } from "@/pages/PageLoader";
import { CursorTrail } from "@/shared/ui/CursorTrail";
import { useThemeStore } from "@/entities/session/model/themeStore";
import { MobileMenu } from "@/widgets/MobileMenu/MobileMenu";
import { BurgerButton } from "@/shared/ui/BurgerButton/BurgerButton";
//Уведомления:
import { Toaster } from "react-hot-toast";

export const MainLayout = () => {
  const { isLoading, isError } = useProfile();
  const isAuth = useAuthStore((state) => state.isAuth);

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
      {/*Настройки всплывающих уведомлений от react-hot-toast:*/}
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

      <CursorTrail />
      <Header />
      <MobileMenu />
      <BurgerButton />

      {/*Основной контент страницы:*/}
      <main className="content-wrapper">
        <Outlet />
      </main>

      <Footer />
    </>
  );
};
