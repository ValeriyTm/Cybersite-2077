import { useMutation, useQuery } from "@tanstack/react-query";
import { useTradingStore } from "../model/tradingStore";
import { $api } from "@/shared/api/api";
import { useQueryClient } from "@tanstack/react-query";

export const useCart = () => {
  const queryClient = useQueryClient();

  //Достаем методы из Zustand. Это позволяет нам мгновенно менять UI, не дожидаясь ответа от сервера (концепция Optimistic UI):
  const {
    setCart,
    addToCartLocally,
    updateItemQuantity,
    removeSelectedLocally,
  } = useTradingStore();

  //1) Загрузка корзины:
  const { isLoading } = useQuery({
    queryKey: ["cart"], //Уникальный идентификатор данных корзины в кэше.
    queryFn: async () => {
      const { data } = await $api.get<any[]>("/trading/cart");
      setCart(data);
      return data;
      //Запрос идет на бэкенд (/trading/cart), получает массив товаров и сразу прокидывает его в Zustand через setCart(data), чтобы цифры в хедере и список товаров обновились.
    },
    staleTime: Infinity, //Вечное время жизни кэша. Мы сами будем управлять обновлением корзины через мутации, поэтому лишние автоматические перезапросы нам не нужны.
  });

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
      year: number;
    }) => {
      addToCartLocally(item.id, item.quantity); //Сначала добавляем данные в локальную корзину (Optimistic UI)

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
    //Если сервер подтвердил добавление, то актуальный состав корзины записываем в локальное состояние корзины:
    onSuccess: (data) => setCart(data),
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
    onSuccess: (data) => setCart(data),
  });

  //4) Удаление одного товара из корзины:
  const { mutate: removeItem } = useMutation({
    mutationFn: async (id: string) => {
      //Отправляем изменения на сервер:
      const { data } = await $api.delete(`/trading/cart/item/${id}`);
      //Сервер возвращает актуальный состав корзины:
      return data;
    },
    onSuccess: (data) => setCart(data),
  });

  //5) Массовое удаление товаров из корзины:
  const { mutate: removeSelected } = useMutation({
    mutationFn: async (ids: string[]) => {
      //Отправляем изменения на сервер:
      const { data } = await $api.post("/trading/cart/remove-selected", {
        ids,
      });
      //Сервер возвращает актуальный состав корзины:
      return data;
    },
    onSuccess: (data) => {
      //Если сервер подтвердил добавление, то актуальный состав корзины записываем в локальное состояние корзины:
      setCart(data);
      removeSelectedLocally(); //Сбрасываем локальные чекбоксы
    },
  });

  //Возвращаем объект со всеми методами мутаций и состоянием загрузки:
  return {
    addToCart,
    updateQuantity,
    removeItem,
    removeSelected,
    isLoading,
  };
};
