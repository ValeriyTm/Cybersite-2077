import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { $api } from "@/shared/api/api";
import { toast } from "react-hot-toast";

interface AuthState {
  // user: any | null;
  accessToken: string | null;
  isAuth: boolean;
  // isLoading: boolean;
  // Поля для 2FA
  tempUserId: string | null;
  setTempUserId: (id: string | null) => void;
  // Методы
  setAuth: (token: string | null) => void;
  clearAuth: () => void;
  // logout: () => void;
  // logoutAll: () => void;
  // checkAuth: () => Promise<void>;
}

// Глобальный флаг для предотвращения "гонки" запросов (Race Condition):
// let isRefreshing = false;

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // user: null,
        accessToken: null,
        isAuth: false,
        // isLoading: false,
        tempUserId: null,

        // Экшен для временного хранения ID админа при логине
        setTempUserId: (id) => set({ tempUserId: id }),

        setAuth: (token) =>
          set({
            // user,
            accessToken: token,
            isAuth: !!token,
            // isLoading: false,
            tempUserId: null, // Сбрасываем временный ID при успешном входе
          }),

        clearAuth: () =>
          set({ accessToken: null, isAuth: false, tempUserId: null }),
      }),
      // logout: async () => {
      //   try {
      //     await $api.post("/identity/auth/logout");
      //   } catch (e) {
      //     console.error("Сервер уже удалил сессию или недоступен");
      //   } finally {
      //     get().setAuth(null, "");
      //     toast.success("Вы вышли из аккаунта");
      //   }
      // },
      // logout: () => {
      //   set({ accessToken: null, isAuth: false, tempUserId: null });
      //   // Очистка кэша React Query произойдет в хуке
      // },

      // logoutAll: async () => {
      //   try {
      //     await $api.post("/identity/auth/logout-all");
      //   } finally {
      //     get().setAuth(null, "");
      //     toast.success("Вы вышли со всех устройств");
      //   }
      // },

      // checkAuth: async () => {
      //   if (isRefreshing) return;
      //   isRefreshing = true;
      //   set({ isLoading: true });

      //   try {
      //     const response = await $api.get("/identity/auth/refresh");
      //     get().setAuth(response.data.user, response.data.accessToken);
      //   } catch (e) {
      //     get().setAuth(null, "");
      //   } finally {
      //     isRefreshing = false;
      //     set({ isLoading: false });
      //   }
      // },
      // }),
      {
        name: "auth-storage",
        // Не сохраняем временные данные и флаги загрузки в localStorage
        partialize: (state) => ({
          // user: state.user,
          accessToken: state.accessToken,
          isAuth: state.isAuth,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);
