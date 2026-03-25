import { Navigate } from "react-router";
import { useAuthStore } from "@/features/auth/model/auth-store";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuthStore();

  if (!isAuth) {
    //Если нет авторизации — отправляем на /auth
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
