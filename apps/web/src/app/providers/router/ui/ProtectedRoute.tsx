//Роутинг:
import { Navigate } from "react-router";
//Состояния:
import { useAuthStore } from "@/features/auth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuthStore(); //Состояние авторизации юзера

  if (!isAuth) {
    //Если нет авторизации — отправляем на /auth:
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
