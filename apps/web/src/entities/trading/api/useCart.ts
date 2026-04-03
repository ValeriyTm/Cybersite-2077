import { useMutation, useQuery } from "@tanstack/react-query";
import { useTradingStore } from "../model/tradingStore";
import { $api } from "@/shared/api/api";
import { useQueryClient } from "@tanstack/react-query";

export const useCart = () => {
  const queryClient = useQueryClient();
  const {
    setCart,
    addToCartLocally,
    updateItemQuantity,
    removeSelectedLocally,
  } = useTradingStore();

  //1) Загрузка корзины:
  const { isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await $api.get<any[]>("/trading/cart");
      setCart(data);
      return data;
    },
    staleTime: Infinity,
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
      addToCartLocally(item.id, item.quantity);

      //Мы должны отправить весь объект item в Body:
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
      return data;
    },
    onSuccess: (data) => setCart(data),
  });

  //3) Обновление количества (PATCH):
  const { mutate: updateQuantity } = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      updateItemQuantity(id, quantity); // Optimistic UI
      const { data } = await $api.patch("/trading/cart/quantity", {
        motorcycleId: id,
        quantity,
      });
      return data;
    },
    onSuccess: (data) => setCart(data),
  });

  //4) Удаление одного товара (DELETE):
  const { mutate: removeItem } = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await $api.delete(`/trading/cart/item/${id}`);
      return data;
    },
    onSuccess: (data) => setCart(data),
  });

  //5) Массовое удаление (POST):
  const { mutate: removeSelected } = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await $api.post("/trading/cart/remove-selected", {
        ids,
      });
      return data;
    },
    onSuccess: (data) => {
      setCart(data);
      removeSelectedLocally(); // Чистим локальные чекбоксы
    },
  });

  return {
    addToCart,
    updateQuantity,
    removeItem,
    removeSelected,
    isLoading,
  };
};
