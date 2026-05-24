//Состояния:
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTradingStore } from "@/entities/trading/model";
import { useShallow } from "zustand/react/shallow"; // Для стабильности ссылок
import { useAuthStore } from "@/features/auth";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";
//Типы:
import { type MotorcycleCart } from "@/entities/catalog";
import { useEffect } from "react";

export const useCart = () => {
  const queryClient = useQueryClient();

  const isAuth = useAuthStore((state) => state.isAuth);
  const accessToken = useAuthStore((state) => state.accessToken);

  //Достаем методы из Zustand. Это позволяет нам мгновенно менять UI, не дожидаясь ответа от сервера (концепция Optimistic UI):
  const {
    setCart,
    addToCartLocally,
    updateItemQuantity,
    removeSelectedLocally,
    toggleSelectItem,
    toggleSelectAll,
  } = useTradingStore(
    useShallow((state) => ({
      setCart: state.setCart,
      addToCartLocally: state.addToCartLocally,
      updateItemQuantity: state.updateItemQuantity,
      removeSelectedLocally: state.removeSelectedLocally,
      toggleSelectItem: state.toggleSelectItem,
      toggleSelectAll: state.toggleSelectAll,
    })),
  );

  //1) Загрузка корзины:
  const query = useQuery({
    queryKey: ["cart"], //Уникальный идентификатор данных корзины в кэше.
    queryFn: async () => {
      const { data } = await $api.get<MotorcycleCart[]>("/trading/cart");
      return data;
    },
    enabled: isAuth && !!accessToken,
    staleTime: Infinity, //Вечное время жизни кэша. Мы сами будем управлять обновлением корзины через мутации, поэтому лишние автоматические перезапросы нам не нужны.
  });

  //Синхронизируем кэш React Query с Zustand:
  useEffect(() => {
    if (query.data) {
      const currentCart = useTradingStore.getState().cartItems;

      //Проверяем, совпадает ли состав корзины на сервере с тем, что у нас в стейте.
      //(сравниваем длину и связку "id + количество + чекбокс" для каждого элемента):
      const isIdentical =
        currentCart.length === query.data.length &&
        currentCart.every((localItem, index) => {
          const serverItem = query.data[index];
          return (
            serverItem &&
            localItem.id === serverItem.id &&
            localItem.quantity === serverItem.quantity &&
            localItem.selected === serverItem.selected
          );
        });

      // Если данные отличаются, тогда обновляем стейт. Если они одинаковые — игнорируем, предотвращая холостой рендер.
      if (!isIdentical) {
        setCart(query.data);
      }
    }
  }, [query.data, setCart]);

  //2) Добавление в корзину:
  const { mutate: addToCart } = useMutation({
    mutationFn: async (item: {
      id: string;
      quantity: number;
      model: string;
      price: number;
      image: string;
      brandSlug: string;
      slug: string;
      selected: boolean;
      totalInStock: number;
      year: number;
    }) => {
      addToCartLocally(item); //Сначала добавляем данные в локальную корзину (Optimistic UI)

      //Отправляем на сервер объект item (со всеми данными о мотоцикле) в Body, чтобы бэкенд мог сохранить данные в Redis (там корзина):
      const { data } = await $api.post("/trading/cart/add", {
        motorcycleId: item.id,
        quantity: item.quantity,
        model: item.model,
        price: item.price,
        image: item.image,
        brandSlug: item.brandSlug,
        slug: item.slug,
        year: item.year,
      });
      //Сервер возвращает актуальный состав корзины:
      return data;
    },
    //Если сервер подтвердил добавление, то:
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data); //Обновляем кэш
      // setCart(data); //Актуальный состав корзины записываем в локальное состояние корзины
    },
  });

  //3) Обновление количества в корзине (PATCH):
  const { mutate: updateQuantity } = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      updateItemQuantity(id, quantity); //Локально обновляем кол-во в корзине (Optimistic UI)
      //Отправляем изменения на сервер:
      const { data } = await $api.patch("/trading/cart/quantity", {
        motorcycleId: id,
        quantity,
      });
      //Сервер возвращает актуальный состав корзины:
      return data;
    },
    //Если сервер подтвердил добавление, то актуальный состав корзины записываем в локальное состояние корзины:
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  //4) Удаление одного товара из корзины:
  const { mutate: removeItem } = useMutation({
    mutationFn: async (id: string) => {
      //Отправляем изменения на сервер:
      const { data } = await $api.delete(`/trading/cart/item/${id}`);
      //Сервер возвращает актуальный состав корзины:
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      toast.success("Выбранный товар удален");
    },
  });

  //5) Удаление выбранных товаров из корзины:
  const { mutate: removeSelected } = useMutation({
    mutationFn: async (ids: string[]) => {
      //Отправляем запрос на массовое удаление
      const { data } = await $api.post("/trading/cart/remove-selected", {
        ids,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      removeSelectedLocally();
      toast.success("Выбранные товары удалены");
    },
  });

  //6) Мутация переключения одного товара:
  const { mutate: toggleSelect } = useMutation({
    mutationFn: async ({ id, selected }: { id: string; selected: boolean }) => {
      // Optimistic UI: меняем галочку в Zustand мгновенно
      toggleSelectItem(id);

      const { data } = await $api.patch("/trading/cart/select", {
        motorcycleId: id,
        selected,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  //7) Мутация "Выбрать всё"
  const { mutate: selectAll } = useMutation({
    mutationFn: async (isSelected: boolean) => {
      toggleSelectAll(isSelected); // Optimistic UI
      const { data } = await $api.patch("/trading/cart/select-all", {
        isSelected,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  //Возвращаем объект со всеми методами мутаций и состоянием загрузки:
  return {
    addToCart,
    updateQuantity,
    removeItem,
    removeSelected,
    isLoading: query.isLoading,
    toggleSelect,
    selectAll,
  };
};
