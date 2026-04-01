import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface TradingState {
  favoriteIds: string[]; //Массив ID избранных моделей
  setFavorites: (ids: string[]) => void;
  toggleFavoriteLocally: (motorcycleId: string) => void; // Локальный тумблер (мгновенное обновление UI)
  isFavorite: (motorcycleId: string) => boolean; // Проверка: добавлен ли в избранное конкретный байк
  clearTrading: () => void; //Очистка при выходе из аккаунта
}

export const useTradingStore = create<TradingState>()(
  devtools((set, get) => ({
    favoriteIds: [],

    setFavorites: (ids) => set({ favoriteIds: ids }),

    toggleFavoriteLocally: (id) => {
      const { favoriteIds } = get();
      const isFav = favoriteIds.includes(id);

      set({
        favoriteIds: isFav
          ? favoriteIds.filter((favId) => favId !== id) // Убираем
          : [...favoriteIds, id], // Добавляем
      });
    },

    isFavorite: (id) => get().favoriteIds.includes(id),

    clearTrading: () => set({ favoriteIds: [] }),
  })),
);
