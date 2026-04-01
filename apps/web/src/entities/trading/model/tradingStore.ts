import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface CartItem {
  id: string;
  model: string;
  price: number;
  image: string;
  brandSlug: string;
  slug: string;
  quantity: number;
  selected: boolean;
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
  updateItemQuantity: (id: string, quantity: number) => void;

  clearTrading: () => void; //Очистка при выходе из аккаунта
}

export const useTradingStore = create<TradingState>()(
  devtools((set, get) => ({
    favoriteIds: [],
    cartItems: [],

    setFavorites: (ids) => set({ favoriteIds: ids }),
    // setCart: (items) => set({ cartItems: items }),

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
    // 1. Переключить выбор конкретного товара (чекбокс на карточке) ✅
    toggleSelectItem: (id: string) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item,
        ),
      })),

    // 2. Выбрать все или снять выбор со всех (главный чекбокс вверху) 🏁
    toggleSelectAll: (isSelected: boolean) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) => ({
          ...item,
          selected: isSelected,
        })),
      })),

    // 3. Обновить количество товара локально (для мгновенного пересчета суммы) 🔢
    updateItemQuantity: (id: string, quantity: number) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
        ),
      })),

    // 4. Удалить выбранные товары из стора (после успешного запроса к Redis) 🧹
    removeSelectedLocally: () =>
      set((state) => ({
        cartItems: state.cartItems.filter((item) => !item.selected),
      })),

    // 5. Установить корзину целиком (синхронизация с ответом сервера) 🔄
    setCart: (items: CartItem[]) =>
      set({
        // При получении данных с сервера добавляем поле selected, если его нет
        cartItems: items.map((item) => ({
          ...item,
          selected: item.selected ?? true, // По умолчанию товары в корзине выбраны
        })),
      }),

    //Очистка:
    clearTrading: () => set({ favoriteIds: [] }),
  })),
);
