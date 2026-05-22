//Состояния:
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTradingStore } from "@/entities/trading/model";

//API:
import { $api } from "@/shared/api";
import { useEffect } from "react";

export const useFavorites = () => {
  const setFavorites = useTradingStore((state) => state.setFavorites);
  const toggleFavoriteLocally = useTradingStore(
    (state) => state.toggleFavoriteLocally,
  );

  const queryClient = useQueryClient();

  //1) Запрос списка ID избранных мотоциклов при загрузке:
  const query = useQuery({
    queryKey: ["favorites-ids"], //Уникальный идентификатор данных избранного в кэше.
    queryFn: async () => {
      //Получаем данные с сервера:
      const { data } = await $api.get<string[]>("/trading/favorites/ids");
      return data;
    },
    staleTime: Infinity, //Данные "вечные", пока не сами не нажмем на кнопку добавления в избранное
  });

  // 2) Синхронизируем кэш React Query с Zustand только когда данные реально изменились:
  useEffect(() => {
    if (query.data) {
      setFavorites(query.data); //Полученные данные сохраняем в Zustand. Благодаря этому при входе в аккаунт все сердечки на сайте сразу принимают нужное состояние
    }
  }, [query.data, setFavorites]);

  //3) Мутация для переключения лайка:
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
    onSuccess: () => {
      //Сбрасываем кэш списка ID, чтобы React Query перекачал актуальный массив с сервера и обновил Zustand правильными данными
      queryClient.invalidateQueries({ queryKey: ["favorites-ids"] });

      // Инвалидируем кэш страницы избранного. React Query поймет, что список товаров изменился, и мягко обновит его в фоне
      queryClient.invalidateQueries({ queryKey: ["favorites-full"] });
    },
    onError: (err, motorcycleId) => {
      //Если сервер ответил ошибкой — откатываем UI назад (вызываем ещё раз toggleFavoriteLocally, что откатит состояние):
      toggleFavoriteLocally(motorcycleId);
      console.error("Ошибка при лайке:", err);
    },
  });

  return { toggleFavorite, isLoading: query.isLoading };
};
