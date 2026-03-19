import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { $api } from "@/shared/api/api";
import { toast } from "react-hot-toast";

interface AuthState {
  user: any | null;
  accessToken: string | null;
  isAuth: boolean;
  isLoading: boolean; // Чтобы не "мигало" при загрузке
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  logoutAll: () => void;
  checkAuth: () => Promise<void>;
}

let isRefreshing = false;

export const useAuth = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuth: false,
        isLoading: true, // Изначально загружаемся

        setAuth: (user, token) =>
          set({ user, accessToken: token, isAuth: true, isLoading: false }),

        logout: async () => {
          try {
            await $api.post("/identity/auth/logout");
          } catch (e) {
            console.error("Сервер уже удалил сессию или недоступен");
          } finally {
            set({
              user: null,
              accessToken: null,
              isAuth: false,
              isLoading: false,
            });
            toast.success("Вы вышли из аккаунта");
          }
        },

        logoutAll: async () => {
          try {
            await $api.post("/identity/auth/logout-all");
          } finally {
            set({ user: null, accessToken: null, isAuth: false });
            toast.success("Вы вышли со всех устройств");
          }
        },

        checkAuth: async () => {
          //Если мы уже загружаемся — игнорируем повторный вызов:
          if (useAuth.getState().isLoading) return;

          if (isRefreshing) return; // Если уже проверяем — второй запрос не пускаем

          isRefreshing = true;
          set({ isLoading: true });
          try {
            // Идем на наш эндпоинт, который проверяет куку
            const response = await $api.get("/identity/auth/refresh");
            // Если сервер ответил успехом — обновляем данные:
            set({
              user: response.data.user,
              accessToken: response.data.accessToken,
              isAuth: true,
            });
          } catch (e) {
            set({ user: null, accessToken: null, isAuth: false });
          } finally {
            set({ isLoading: false });
            isRefreshing = false;
          }
        },
      }),
      { name: "auth-storage" }, //Имя в localStorage
    ),
    { name: "AuthStore" }, // Имя стора в панели DevTools
  ),
);
