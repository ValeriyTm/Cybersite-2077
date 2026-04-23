//Состояния:
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTradingStore } from "@/entities/trading/model";
//API:
import { $api } from "@/shared/api";

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const { setFavorites, toggleFavoriteLocally } = useTradingStore();

  //1) Запрос списка ID избранных мотоциклов при загрузке:
  const { isLoading } = useQuery({
    queryKey: ["favorites-ids"], //Уникальный идентификатор данных избранного в кэше.
    queryFn: async () => {
      //Получаем данные с сервера:
      const { data } = await $api.get<string[]>("/trading/favorites/ids");
      setFavorites(data); //Полученные данные сохраняем в Zustand. Благодаря этому при входе в аккаунт все сердечки на сайте сразу принимают нужное состояние
      return data;
    },
    staleTime: Infinity, //Данные "вечные", пока не сами не нажмем на кнопку добавления в избранное
  });

  //2) Мутация для переключения лайка:
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async (motorcycleId: string) => {
      //Сначала обновляем UI мгновенно (концепт Optimistic UI):
      toggleFavoriteLocally(motorcycleId);

      //Затем отправляем обновление на сервер:
      const { data } = await $api.post(
        `/trading/favorites/toggle/${motorcycleId}`,
      );
      return data;
    },
    onError: (err, motorcycleId) => {
      //Если сервер ответил ошибкой — откатываем UI назад (вызываем ещё раз toggleFavoriteLocally, что откатит состояние):
      toggleFavoriteLocally(motorcycleId);
      console.error("Ошибка при лайке:", err);
    },
  });

  return { toggleFavorite, isLoading };
};
