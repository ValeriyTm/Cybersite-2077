import { useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { useAuthStore } from "./auth-store";
import { type IUser } from "@repo/types";

export const useProfile = () => {
  const { isAuth, setAuth, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery<IUser>({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const res = await $api.get("/identity/auth/refresh");
        setAuth(res.data.accessToken);
        return res.data.user;
      } catch (e) {
        // Если сервер ответил 401, значит сессии нет — чистим стор
        clearAuth();
        throw e; // Пробрасываем ошибку дальше в React Query
      }
    },
    // Запрос идет только если isAuth === true (мы верим, что у нас есть кука/токен)
    enabled: isAuth,
    staleTime: 1000 * 60 * 5, // Кэшируем данные на 5 минут
    retry: false, // ВАЖНО: не нужно пытаться стучаться 3 раза, если 401
  });

  const logout = async () => {
    try {
      await $api.post("/identity/auth/logout");
    } finally {
      clearAuth();
      queryClient.removeQueries({ queryKey: ["profile"] }); // Чистим кэш
    }
  };

  const logoutAll = async () => {
    try {
      await $api.post("/identity/auth/logout-all");
    } finally {
      clearAuth();
      queryClient.removeQueries({ queryKey: ["profile"] });
    }
  };

  return {
    user: query.data,
    isLoading: isAuth && query.isLoading && !query.isError,
    isError: query.isError,
    logout: logout,
    logoutAll,
    refetch: query.refetch,
  };
};
