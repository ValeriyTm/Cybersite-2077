//--------------Хранилище для работы с состоянием избранного и корзины-------------//
//Zustand:
import { create } from "zustand";
import { devtools } from "zustand/middleware";
//API:
import { $api } from "@/shared/api";

interface CartItem {
  id: string;
  model: string;
  price: number;
  image: string;
  brandSlug: string;
  slug: string;
  quantity: number;
  selected: boolean;
  totalInStock: number;
}

interface TradingState {
  favoriteIds: string[]; //Массив ID избранных моделей
  cartItems: CartItem[]; //Массив объектов корзины

  setFavorites: (ids: string[]) => void;
  setCart: (items: CartItem[]) => void;

  //Логика избранного
  toggleFavoriteLocally: (motorcycleId: string) => void; //Локальное добавление в избранное (для Optimistic UI)
  isFavorite: (motorcycleId: string) => boolean; //Проверка: добавлена ли в избранное конкретная модель

  //Логика корзины:
  addToCartLocally: (id: string, quantity?: number) => void; //Локальное добавление в корзину (для Optimistic UI)
  removeFromCartLocally: (id: string) => void; //Локальное удаление из корзины товара

  //Логика работы с чекбоксами в корзине:
  toggleSelectItem: (id: string) => void;
  toggleSelectAll: (isSelected: boolean) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeSelectedLocally: () => void; //Локальное удаление из корзины товаров (выбранных)
  fetchCart: () => void;

  fetchFavoritesIds: () => void;

  clearTrading: () => void; //Очистка при выходе из аккаунта
}

export const useTradingStore = create<TradingState>()(
  devtools((set, get) => ({
    favoritesCount: 0,
    favoriteIds: [],
    cartItems: [],

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

    //Добавление в корзину:
    addToCartLocally: (id, quantity = 1) => {
      //Достаем из хранилища текущий массив объектов корзины cartItems:
      const { cartItems } = get();
      //Ищем в массиве объект, у которого id совпадает с переданным. Если нашли — он сохранится в existing:
      const existing = cartItems.find((item) => item.id === id);

      //Если товар уже есть в корзине, выполняем блок обновления:
      if (existing) {
        set({
          cartItems: cartItems.map((item) =>
            //Если это тот самый товар, мы создаем его копию и прибавляем новое количество к текущему. Остальные товары оставляем без изменений:
            item.id === id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          ),
        });
      } else {
        //Если товара в корзине ещё нет, то создаем новый массив, куда копируем старые элементы и добавляем новый объект с id и quantity:
        set({ cartItems: [...cartItems, { id, quantity }] });
      }
    },

    //Удаляем товар из массива локальных товаров в корзине по его ID:
    removeFromCartLocally: (id) =>
      set({
        cartItems: get().cartItems.filter((item) => item.id !== id),
      }),

    ////Чебоксы для корзины:

    //1.Переключить выбор конкретного товара (чекбокс на карточке):
    toggleSelectItem: (id: string) =>
      set((state) => ({
        //Перебираем все товары в корзине и создаем на основе этого новый массив.
        //(Если переданный id совпадает с тем, что вв массиве,  — создаем копию этого объекта и инвертируем свойство selected. Если id не совпадает — возвращаем товар без изменений)
        cartItems: state.cartItems.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item,
        ),
      })),

    //2.Выбрать все или снять выбор со всех (главный чекбокс вверху компонента корзины):
    toggleSelectAll: (isSelected: boolean) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) => ({
          ...item,
          selected: isSelected,
        })),
      })),

    //3. Обновить количество товара в корзине локально (для мгновенного пересчета суммы):
    updateItemQuantity: (id: string, quantity: number) =>
      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
        ),
      })),

    //4. Удалить выбранные товары из локальной корзины (после успешного запроса к Redis):
    removeSelectedLocally: () =>
      set((state) => ({
        cartItems: state.cartItems.filter((item) => !item.selected),
      })),
    //Оставляет в корзине только те товары, у которых selected: false. Это «подчищает» интерфейс, оставляя пользователю то, что он решил не удалять/не покупать.

    //5. Установить значения корзины целиком (синхронизация с ответом сервера):
    setCart: (items: CartItem[]) =>
      set({
        cartItems: items.map((item) => ({
          ...item,
          selected: item.selected,
        })),
      }),

    //Метод для простого получения (обновления) данных корзины:
    //(просто делаем запрос к серверу, а затем синхронизируем при помощи вызова setCart)
    fetchCart: async () => {
      try {
        const response = await $api.get("/trading/cart"); //Эндпоинт корзины
        //Используем твой готовый метод для записи и расстановки selected
        get().setCart(response.data);
      } catch (error) {
        console.error("Ошибка при обновлении корзины:", error);
      }
    },

    //Метод получения списка id избранных товаров:
    fetchFavoritesIds: async () => {
      try {
        //Получаем с сервера список id избранных товаров:
        const { data } = await $api.get<string[]>("/trading/favorites/ids");
        get().setFavorites(data); // Используем уже готовый setFavorites, который обновит и count
      } catch (e) {
        console.error(e);
      }
    },

    //Очистка корзины и счетчика избранных (при логауте вызываем):
    clearTrading: () =>
      set({ cartItems: [], favoriteIds: [], favoritesCount: 0 }),
  })),
);
