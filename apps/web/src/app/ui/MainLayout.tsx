import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth } from "@/features/auth/model/auth-store";

export const MainLayout = () => {
  const checkAuth = useAuth((state) => state.checkAuth);
  const isLoading = useAuth((state) => state.isLoading);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "100px" }}
      >
        <h2>Загрузка приложения...</h2>
      </div>
    );
  }

  // Outlet — это место, куда React Router подставит текущую страницу (Home, Auth или Profile)
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Outlet />
    </>
  );
};
