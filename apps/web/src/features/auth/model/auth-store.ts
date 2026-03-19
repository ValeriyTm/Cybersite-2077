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

// Глобальный флаг для предотвращения "гонки" запросов (Race Condition):
let isRefreshing = false;

export const useAuth = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        isAuth: false,
        isLoading: false, // 1. Изначально ставим false, чтобы checkAuth не блокировался

        setAuth: (user, token) =>
          set({
            user,
            accessToken: token,
            // Если пользователь передал null или пустой токен — авторизации нет
            isAuth: !!user && !!token,
            isLoading: false,
          }),

        logout: async () => {
          try {
            await $api.post("/identity/auth/logout");
          } catch (e) {
            console.error("Сервер уже удалил сессию или недоступен");
          } finally {
            // set({
            //   user: null,
            //   accessToken: null,
            //   isAuth: false,
            //   isLoading: false,
            // });
            // Сбрасываем всё через setAuth для консистентности
            get().setAuth(null, "");
            toast.success("Вы вышли из аккаунта");
          }
        },

        logoutAll: async () => {
          try {
            await $api.post("/identity/auth/logout-all");
          } finally {
            // set({ user: null, accessToken: null, isAuth: false });
            get().setAuth(null, "");
            toast.success("Вы вышли со всех устройств");
          }
        },

        checkAuth: async () => {
          //Используем isRefreshing для защиты от двойного вызова
          if (isRefreshing) return;
          // Если уже проверяем — второй запрос не пускаем

          isRefreshing = true;
          set({ isLoading: true });

          try {
            // Идем на наш эндпоинт, который проверяет куку
            const response = await $api.get("/identity/auth/refresh");
            // Если сервер ответил успехом — обновляем данные:

            // Используем метод стора, чтобы обновить все флаги разом
            get().setAuth(response.data.user, response.data.accessToken);
          } catch (e) {
            // Если ошибка (например, 401), сбрасываем состояние
            get().setAuth(null, "");
          } finally {
            isRefreshing = false;
            set({ isLoading: false });
          }
        },
      }),
      { name: "auth-storage" }, //Имя в localStorage
    ),
    { name: "AuthStore" }, // Имя стора в панели DevTools
  ),
);
