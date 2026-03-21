import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router";
// import { useEffect } from "react";
import { useProfile } from "@/features/auth/model/use-profile";
import { useAuthStore } from "@/features/auth/model/auth-store";

export const MainLayout = () => {
  // Хук useProfile сам инициирует запрос и вернет актуальный статус загрузки:
  const { isLoading, isError } = useProfile();
  const isAuth = useAuthStore((state) => state.isAuth);

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
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
      <Outlet />
    </>
  );
};
{
  /* Outlet подставит текущую страницу */
}
