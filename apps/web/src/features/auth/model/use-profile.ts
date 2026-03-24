//----------------------Серверное хранилище
//React Query:
import { useQuery, useQueryClient } from "@tanstack/react-query";
//Экземпляр axios:
import { $api } from "@/shared/api/api";
//Клиентское хранилище:
import { useAuthStore } from "./auth-store";
//Тип данных (информация о пользователи), приходящих от сервера:
import { type IUser } from "@repo/types";

export const useProfile = () => {
  //Извлекаем состояние авторизации и функции управления из Zustand:
  const { isAuth, setAuth, clearAuth } = useAuthStore();
  //Получаем доступ к управлению всем кэшем React Query:
  const queryClient = useQueryClient();

  const query = useQuery<IUser>({
    queryKey: ["profile"], //Имя, под которым сохраним данные в кэше.
    //Функция, описывающая, как будем получать данные из кэша:
    queryFn: async () => {
      try {
        //Осуществляем запрос к серверу:
        const res = await $api.get("/identity/auth/refresh");
        //Устанавливаем access токен из ответа в клиентское хранилище:
        setAuth(res.data.accessToken);
        //Возвращаем полученные данные о юзере:
        return res.data.user;
      } catch (e) {
        //Если сервер ответил 401, значит сессии нет, поэтому чистим localStorage:
        clearAuth();
        throw e; // Пробрасываем ошибку дальше в React Query
      }
    },
    enabled: isAuth, // Запрос идет только если isAuth === true (запрос не уйдет, если пользователь не авторизован)
    staleTime: 1000 * 60 * 5, //Кэшируем данные на 5 минут (время, когда данные "свежие")
    retry: false, //Отключаем повторные запросы при ошибке (например, нет куки).
  });

  const logout = async () => {
    try {
      //Уведомляем сервер о закрытии сессии, чтобы тот удалил токен из БД:
      await $api.post("/identity/auth/logout");
    } finally {
      //Чистим localStorage:
      clearAuth();
      //Чистим кэш, чтобы следующий вошедший пользователь не увидел данные предыдущего на долю секунды:
      queryClient.removeQueries({ queryKey: ["profile"] });
    }
  };

  const logoutAll = async () => {
    try {
      //Уведомляем сервер о закрытии всех сессий, чтобы тот удалил токен из БД:
      await $api.post("/identity/auth/logout-all");
    } finally {
      //Чистим localStorage:
      clearAuth();
      //Удаляем данные профиля из кэша, чтобы следующий вошедший пользователь не увидел данные предыдущего на долю секунды:
      queryClient.removeQueries({ queryKey: ["profile"] });
    }
  };

  return {
    user: query.data, //Объект пользователя
    isLoading: isAuth && query.isLoading && !query.isError, //Мы показываем состояние загрузки только если мы авторизованы и данные реально качаются.
    isError: query.isError,
    logout: logout,
    logoutAll,
    refetch: query.refetch, //Позволяет вручную обновить данные профиля (например, после смены аватарки).
  };
};
