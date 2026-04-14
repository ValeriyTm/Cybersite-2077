//Роутинг:
import { Navigate } from "react-router";
//Данные пользователя:
import { useAuthStore } from "@/features/auth/model/useAuthStore";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuthStore(); //Состояние авторизации юзера

  if (!isAuth) {
    //Если нет авторизации — отправляем на /auth:
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
