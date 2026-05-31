//-----------------------Хранилище данных об авторизации юзера (авторизован ли он и его access-токен)--------//
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  //Авторизован ли пользователь:
  isAuth: boolean;
  //Поля для 2FA:
  tempUserId: string | null;
  isCheckingAuth: boolean; //Флаг проверки при старте приложения
  setCheckingAuth: (val: boolean) => void;
  setTempUserId: (id: string | null) => void;
  setAuth: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        //---------Дефолтные значения переменных:
        accessToken: null,
        isAuth: false,
        tempUserId: null,
        isCheckingAuth: true,
        //---------Actions:
        setCheckingAuth: (val) => set({ isCheckingAuth: val }),
        //Action для временного хранения ID админа при логине:
        setTempUserId: (id) => set({ tempUserId: id }),

        //Главный action для входа в аккаунт (сохраняет токен,  ставит флаг isAuth: true и очищает временный ID. !!token превращает наличие строки в логическое true):
        setAuth: (token) =>
          set({
            accessToken: token,
            isAuth: !!token,
            tempUserId: null, // Сбрасываем временный ID при успешном входе
          }),

        //Action выхода из аккаунта (сбрасываем всё в дефолтные значения):
        clearAuth: () =>
          set({ accessToken: null, isAuth: false, tempUserId: null }),
      }),
      {
        //Настройка параметров для localStorage (Persist):
        name: "auth-storage", //Имя ключа для данных в localStorage
        //Используем функцию partialize, чтобы не сохранять временные данные и флаги загрузки в localStorage:
        partialize: (state) => ({
          // accessToken: state.accessToken,
          isAuth: state.isAuth,
        }),
      },
    ),
    { name: "AuthStore" }, //Имя хранилища в Redux DevTools
  ),
);
