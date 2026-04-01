import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTradingStore } from "../model/tradingStore";
import { $api } from "@/shared/api/api"; //Инстанс axios

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const { setFavorites, toggleFavoriteLocally } = useTradingStore();

  //1) Запрос списка ID при загрузке:
  const { isLoading } = useQuery({
    queryKey: ["favorites-ids"],
    queryFn: async () => {
      const { data } = await $api.get<string[]>("/trading/favorites/ids");
      setFavorites(data); //Сохраняем в Zustand
      return data;
    },
    staleTime: Infinity, //Данные "вечные", пока не нажмем лайк
  });

  //2) Мутация для переключения лайка:
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async (motorcycleId: string) => {
      //Сначала обновляем UI мгновенно (концепт Optimistic UI):
      toggleFavoriteLocally(motorcycleId);

      //Затем отправляем на сервер:
      const { data } = await $api.post(
        `/trading/favorites/toggle/${motorcycleId}`,
      );
      return data;
    },
    onError: (err, motorcycleId) => {
      //Если сервер ответил ошибкой — откатываем UI назад:
      toggleFavoriteLocally(motorcycleId);
      console.error("Ошибка при лайке:", err);
    },
  });

  return { toggleFavorite, isLoading };
};
