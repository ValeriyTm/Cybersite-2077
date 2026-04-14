//Роутинг:
import { Navigate, Outlet } from "react-router";
//Получаем данные юзера:
import { useProfile } from "@/features/auth/model/useProfile";
import { useAuthStore } from "@/features/auth/model/useAuthStore";

export const AdminRoute = () => {
  const { user } = useProfile(); //Данные юзера
  const { isAuth } = useAuthStore(); //Авторизован ли юзер

  const isAdmin =
    user?.role &&
    ["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"].includes(user.role);

  if (!isAuth || !isAdmin) {
    // Если не админ — отправляем на главную:
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
