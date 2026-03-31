import { Navigate } from "react-router";
import { useAuthStore } from "@/features/auth/model/useAuthStore";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuthStore();

  if (!isAuth) {
    //Если нет авторизации — отправляем на /auth
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
