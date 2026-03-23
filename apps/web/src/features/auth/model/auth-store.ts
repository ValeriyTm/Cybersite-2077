//-----------------------Клиентское хранилище
//--Оно управляет состоянием авторизации во всем приложении и сохраняет данные в браузере, чтобы после перезагрузки страницы пользователь не «вылетал» из аккаунта.
import { create } from "zustand";
//Persist - для сохранения состояния в localStorage; devtools - создаёт интерфейс в браузере.
import { persist, devtools } from "zustand/middleware";

//Типизируем состояние, которое хранится в этом хранилище:
interface AuthState {
  //Наш access token:
  accessToken: string | null;
  //Авторизован ли пользователь:
  isAuth: boolean;
  // Поля для 2FA
  tempUserId: string | null;
  setTempUserId: (id: string | null) => void;
  // Методы
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
        //---------Actions:
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
          //Тут указываем, что нужно сохранять в localStorage:
          accessToken: state.accessToken,
          isAuth: state.isAuth,
        }),
      },
    ),
    { name: "AuthStore" }, //Имя хранилища в Redux DevTools
  ),
);
