import { useInfiniteQuery } from "@tanstack/react-query";
import { useTradingStore } from "../model/tradingStore";
import { $api } from "@/shared/api/api";

export const useFavoritesPage = () => {
  const { favoriteIds } = useTradingStore();

  return useInfiniteQuery({
    queryKey: ["favorites-full", favoriteIds],
    queryFn: async ({ pageParam = 0 }) => {
      //Отправляем массив ID мотоциклов из избранного на сервер:
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
    enabled: favoriteIds.length > 0, // Не грузим, если лайков 0
  });
};
