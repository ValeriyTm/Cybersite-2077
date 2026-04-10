// src/app/providers/router/ui/AdminRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useProfile } from "@/features/auth/model/useProfile";
import { useAuthStore } from "@/features/auth/model/useAuthStore";

export const AdminRoute = () => {
  const { user } = useProfile();
  const { isAuth } = useAuthStore();

  const isAdmin =
    user?.role &&
    ["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"].includes(user.role);

  if (!isAuth || !isAdmin) {
    // Если не админ — отправляем на главную или 404
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
