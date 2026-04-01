//Библиотека всплывающих уведомлений:
import { Toaster } from "react-hot-toast";
//Роутер:
import { Outlet } from "react-router";
//Хранилища:
import { useProfile } from "@/features/auth/model/useProfile"; //Серверный стор
import { useAuthStore } from "@/features/auth/model/useAuthStore"; //Клиентский стор
import { useFavorites } from "@/entities/trading/api/useFavorites";
import { useCart } from "@/entities/trading/api/useCart";
//Виджеты:
import { Header } from "@/widgets/Header/ui/Header";

export const MainLayout = () => {
  //Хук useProfile сам инициирует запрос и вернет актуальный статус загрузки:
  const { isLoading, isError } = useProfile();
  //Получим статус авторизации:
  const isAuth = useAuthStore((state) => state.isAuth);

  //Чтобы список избранных товаров подгружался сразу при старте приложения:
  useFavorites();
  //Чтобы список товаров в корзине подгружался сразу при старте приложения:
  useCart();

  //Если авторизован и идёт загрузка, то покажем универсальный лоадер для всех страниц:
  if (isAuth && isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "100px" }}
      >
        <h2>Загрузка приложения...</h2>
      </div>
    );
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

      <Header />

      {/* Основной контент страницы */}
      <main className="content-wrapper">
        <Outlet />
      </main>
    </>
  );
};
{
  /* Outlet подставит текущую страницу */
}
