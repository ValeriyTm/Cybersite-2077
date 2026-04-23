//Состояния:
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTradingStore } from "@/entities/trading/model";
//API:
import { $api } from "@/shared/api";

export const useFavoritesPage = () => {
  const { favoriteIds } = useTradingStore();

  return useInfiniteQuery({
    queryKey: ["favorites-full", favoriteIds],
    queryFn: async ({ pageParam = 0 }) => {
      //Отправляем массив ID мотоциклов из избранного на сервер, чтобы получить все данные о мотоциклах в избранном:
      const { data } = await $api.post("/trading/favorites/details", {
        ids: favoriteIds,
        skip: pageParam,
        limit: 10,
      });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length * 10 : undefined;
    },
    //функция getNextPageParam определяет, есть ли следующая страница и какое значение передать в pageParam для следующего запроса.
    enabled: favoriteIds.length > 0, //Не обновляем данные, если лайков 0
  });
};
