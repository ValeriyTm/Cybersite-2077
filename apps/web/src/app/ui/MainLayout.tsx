import { useEffect, Suspense } from "react";
//Роутер:
import { Outlet } from "react-router";
//Состояния:
import { useProfile, useAuthStore } from "@/features/auth";
import { useFavorites, useCart } from "@/entities/trading";
import { useThemeStore } from "@/entities/session";
//Компоненты:
import { PageLoader } from "@/pages/PageLoader";
import { Header } from "@/widgets/Header";
import { MobileMenu } from "@/widgets/MobileMenu";
import { Footer } from "@/widgets/Footer";
import { CursorTrail, BurgerButton } from "@/shared/ui";

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
      <main className="content-wrapper" style={{ minHeight: '60vh' }}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
    </>
  );
};
