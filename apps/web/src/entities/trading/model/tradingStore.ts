//--------------Хранилище для работы с состоянием избранного и корзины-------------//
//Zustand:
import { create } from "zustand";
import { devtools } from "zustand/middleware";
//Типы:
import type { MotorcycleCart } from "@/entities/catalog";
import type { AddToCartLocally } from "../types/types";

interface TradingState {
  //1) Логика избранного
  favoriteIds: string[]; //Массив ID избранных моделей
  setFavorites: (ids: string[]) => void;
  toggleFavoriteLocally: (motorcycleId: string) => void; //Локальное добавление в избранное (для Optimistic UI)
  isFavorite: (motorcycleId: string) => boolean; //Проверка: добавлена ли в избранное конкретная модель
  favoritesCount: number;

  //2) Логика корзины:
  cartItems: MotorcycleCart[]; //Массив объектов корзины
  setCart: (items: MotorcycleCart[]) => void;
  addToCartLocally: (item: AddToCartLocally) => void; //Локальное добавление в корзину (для Optimistic UI)
  removeFromCartLocally: (id: string) => void; //Локальное удаление из корзины товара
  //Логика работы с чекбоксами в корзине:
  toggleSelectItem: (id: string) => void;
  toggleSelectAll: (isSelected: boolean) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeSelectedLocally: () => void; //Локальное удаление из корзины товаров (выбранных)

  //3) Общее:
  clearTrading: () => void; //Очистка при выходе из аккаунта
}

export const useTradingStore = create<TradingState>()(
  devtools((set, get) => ({
    //1)----------------------Избранное:----------------
    favoritesCount: 0,
    favoriteIds: [],

    //Изменяем список id избранных товаров и счетчик их количества:
    setFavorites: (ids) =>
      set({
        favoriteIds: ids,
        favoritesCount: ids.length, //Синхронизируем при загрузке
      }),

    //Добавление или удаление (переключатель) конкретного товара из избранного:
    toggleFavoriteLocally: (id) => {
      //С помощью метода get() мы достаем текущий массив favoriteIds из хранилища:
      const { favoriteIds } = get();
      //Проверяем, есть ли уже этот id в нашем списке (true/false):
      const isFav = favoriteIds.includes(id);

      //Создаем новый массив newIds:
      const newIds = isFav
        ? favoriteIds.filter((favId) => favId !== id) //Если isFav равно true (товар уже в избранном), то «отфильтровываем» его, создавая массив без этого id (удаление)
        : [...favoriteIds, id]; //Если isFav равно false (товар не в избранном), то создаем новый массив, копируя старые ID и добавляя новый в конец.

      //Вызываем функцию set для обновления состояния хранилища:
      set({
        //Записываем новый сформированный массив в поле favoriteIds:
        favoriteIds: newIds,
        //Обновляем счетчик (кол-во товаров в избранном):
        favoritesCount: newIds.length,
      });
    },

    //Функция-селектор, которую вызывают карточки мотоциклов, чтобы понять, в каком цвете рисовать иконку лайка (закрашенная или контур):
    isFavorite: (id) => get().favoriteIds.includes(id),
    //С помощью метода get() мы достаем текущий массив favoriteIds из хранилища и проверяем, входит ли id текущего байка в массив избранных id
    //2)----------------------Корзина:----------------
    cartItems: [],

    //Добавление в корзину:
    addToCartLocally: (item: AddToCartLocally) => {
      //Достаем из хранилища текущий массив объектов корзины cartItems:
      const { cartItems } = get();
      //Ищем в массиве объект, у которого id совпадает с переданным. Если нашли — он сохранится в existing:
      const existing = cartItems.find((i) => i.id === item.id);

      //Если товар уже есть в корзине, выполняем блок обновления:
      if (existing) {
        set({
          cartItems: cartItems.map((i) =>
            //Если это тот самый товар, мы создаем его копию и прибавляем новое количество к текущему. Остальные товары оставляем без изменений:
            i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          ),
        });
      } else {
        //Если товара в корзине ещё нет, то создаем новый массив, куда копируем старые элементы и добавляем новый объект с id и quantity:
        set({ cartItems: [...cartItems, item as unknown as MotorcycleCart] });
      }
    },

    //Удаляем товар из массива локальных товаров в корзине по его ID:
    removeFromCartLocally: (id) =>
      set({
        cartItems: get().cartItems.filter((item) => item.id !== id),
      }),

    //Обновить количество товара в корзине локально (для мгновенного пересчета суммы):
    updateItemQuantity: (id: string, quantity: number) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
        ),
      })),

    //Удалить выбранные товары из локальной корзины (после успешного запроса к Redis):
    removeSelectedLocally: () =>
      set((state) => ({
        cartItems: state.cartItems.filter((item) => !item.selected),
      })),
    //Оставляет в корзине только те товары, у которых selected: false. Это «подчищает» интерфейс, оставляя пользователю то, что он решил не удалять/не покупать.

    //Установить значение корзины целиком (синхронизация с ответом сервера):
    setCart: (items: MotorcycleCart[]) =>
      set({
        cartItems: items.map((item) => ({
          ...item,
        })),
      }),

    ////Чебоксы для корзины:
    //Переключить выбор конкретного товара (чекбокс на карточке):
    toggleSelectItem: (id: string) =>
      set((state) => ({
        //Перебираем все товары в корзине и создаем на основе этого новый массив.
        //(Если переданный id совпадает с тем, что вв массиве,  — создаем копию этого объекта и инвертируем свойство selected. Если id не совпадает — возвращаем товар без изменений)
        cartItems: state.cartItems.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item,
        ),
      })),

    //Выбрать все или снять выбор со всех (главный чекбокс вверху компонента корзины):
    toggleSelectAll: (isSelected: boolean) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) => ({
          ...item,
          selected: isSelected,
        })),
      })),

    //3)----------------------Общее:----------------
    //Очистка корзины и счетчика избранных (при логауте вызываем):
    clearTrading: () =>
      set({ cartItems: [], favoriteIds: [], favoritesCount: 0 }),
  })),
);
