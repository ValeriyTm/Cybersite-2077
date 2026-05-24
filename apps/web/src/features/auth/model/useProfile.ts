//----------------------Хранилище данных о пользователе--------------------//
//API:
import { $api } from "@/shared/api";
//Состояния:
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTradingStore } from "@/entities/trading";
import { useOrderStore } from "@/entities/ordering";
import { useAuthStore } from "./useAuthStore";
//Тип данных (информация о пользователе), приходящий от сервера:
import { type IUser } from "@repo/types";

export const useProfile = () => {
  //Извлекаем состояние авторизации и функции управления из Zustand:
  const isAuth = useAuthStore((state) => state.isAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  //Не использовал деструктуризацию во избежание лишних ререндеров

  //Получаем доступ к управлению всем кэшем React Query:
  const queryClient = useQueryClient();

  const { resetOrders } = useOrderStore();
  const { clearTrading } = useTradingStore();

  const query = useQuery<IUser>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await $api.get("/identity/profile/me");
      return res.data;
    },
    enabled: isAuth && !!accessToken, // Запрос идет только если isAuth === true (запрос не уйдет, если пользователь не авторизован)
    staleTime: 1000 * 60 * 5, //Кэшируем данные на 5 минут (время, когда данные "свежие")
    retry: false, //Отключаем повторные запросы при ошибке (например, нет куки).
  });

  //Общая логика очистки клиента:
  const localLogoutCleanup = () => {
    clearAuth(); //Чистим состояние авторизации в Zustand
    queryClient.clear(); //Удаляем весь кэш React Query
    clearTrading(); // Очищаем корзину
    resetOrders(); // Очищаем заказы

    delete $api.defaults.headers.common.Authorization; // Стираем старый токен из дефолтных настроек Axios
  };

  const logout = async () => {
    try {
      //Уведомляем сервер о закрытии сессии, чтобы тот удалил токен из БД:
      await $api.post("/identity/auth/logout");
    } finally {
      localLogoutCleanup();
    }
  };

  const logoutAll = async () => {
    try {
      //Уведомляем сервер о закрытии всех сессий, чтобы тот удалил токен из БД:
      await $api.post("/identity/auth/logout-all");
    } finally {
      localLogoutCleanup();
    }
  };

  return {
    user: query.data, //Объект пользователя
    isLoading: isAuth && query.isLoading && !query.isError, //Мы показываем состояние загрузки только если мы авторизованы и данные реально качаются.
    isError: query.isError,
    logout,
    logoutAll,
    refetch: query.refetch, //Позволяет вручную обновить данные профиля (например, после смены аватарки).
  };
};
