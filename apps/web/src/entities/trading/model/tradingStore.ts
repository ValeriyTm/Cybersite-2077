import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface CartItem {
  id: string;
  quantity: number;
  selected?: boolean; // Для чекбокса выбора в корзине
}

interface TradingState {
  favoriteIds: string[]; //Массив ID избранных моделей
  cartItems: CartItem[]; //Массив объектов корзины

  setFavorites: (ids: string[]) => void;
  setCart: (items: CartItem[]) => void;

  //Логика избранного
  toggleFavoriteLocally: (motorcycleId: string) => void; // Локальный тумблер (мгновенное обновление UI)
  isFavorite: (motorcycleId: string) => boolean; // Проверка: добавлен ли в избранное конкретный байк

  //Логика корзины:
  addToCartLocally: (id: string, quantity?: number) => void;
  removeFromCartLocally: (id: string) => void;

  //Логика работы с чекбоксами в корзине:
  toggleSelectItem: (id: string) => void;
  toggleSelectAll: (isSelected: boolean) => void;
  removeSelected: () => void;

  clearTrading: () => void; //Очистка при выходе из аккаунта
}

export const useTradingStore = create<TradingState>()(
  devtools((set, get) => ({
    favoriteIds: [],
    cartItems: [],

    setFavorites: (ids) => set({ favoriteIds: ids }),
    setCart: (items) => set({ cartItems: items }),

    //--Избранное:--
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

    //--Корзина:--
    addToCartLocally: (id, quantity = 1) => {
      const { cartItems } = get();
      const existing = cartItems.find((item) => item.id === id);

      if (existing) {
        set({
          cartItems: cartItems.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          ),
        });
      } else {
        set({ cartItems: [...cartItems, { id, quantity }] });
      }
    },

    removeFromCartLocally: (id) =>
      set({
        cartItems: get().cartItems.filter((item) => item.id !== id),
      }),

    //Чебоксы для корзины:
    toggleSelectItem: (id) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item,
        ),
      })),

    toggleSelectAll: (isSelected) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) => ({
          ...item,
          selected: isSelected,
        })),
      })),

    removeSelected: () =>
      set((state) => ({
        cartItems: state.cartItems.filter((item) => !item.selected),
      })),

    //Очистка:
    clearTrading: () => set({ favoriteIds: [] }),
  })),
);
