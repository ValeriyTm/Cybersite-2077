import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface TradingState {
  // 1. Храним только массив ID избранных моделей
  favoriteIds: string[];

  // 2. Методы управления
  setFavorites: (ids: string[]) => void;

  // Локальный тумблер (мгновенное обновление UI)
  toggleFavoriteLocally: (motorcycleId: string) => void;

  // Проверка: лайкнут ли конкретный байк
  isFavorite: (motorcycleId: string) => boolean;

  // Очистка при выходе из аккаунта
  clearTrading: () => void;
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
