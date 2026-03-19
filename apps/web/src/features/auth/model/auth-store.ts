import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { $api } from "@/shared/api/api";

interface AuthState {
  user: any | null;
  accessToken: string | null;
  isAuth: boolean;
  isLoading: boolean; // Чтобы не "мигало" при загрузке
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

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
          } finally {
            set({
              user: null,
              accessToken: null,
              isAuth: false,
              isLoading: false,
            });
          }
        },

        checkAuth: async () => {
          set({ isLoading: true });
          try {
            // Идем на наш эндпоинт, который проверяет куку
            const response = await $api.get("/identity/auth/refresh");
            set({
              user: response.data.user,
              accessToken: response.data.accessToken,
              isAuth: true,
            });
          } catch (e) {
            // Если кука протухла или её нет — сбрасываем всё
            set({ user: null, accessToken: null, isAuth: false });
          } finally {
            set({ isLoading: false });
          }
        },
      }),
      { name: "auth-storage" }, //Имя в localStorage
    ),
    { name: "AuthStore" }, // Имя стора в панели DevTools
  ),
);
