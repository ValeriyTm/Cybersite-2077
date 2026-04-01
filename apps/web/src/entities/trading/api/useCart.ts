import { useMutation, useQuery } from "@tanstack/react-query";
import { useTradingStore } from "../model/tradingStore";
import { $api } from "@/shared/api/api";

export const useCart = () => {
  const { setCart, addToCartLocally } = useTradingStore();

  //Загрузка корзины при старте приложения:
  const { isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await $api.get<any[]>("/trading/cart");
      setCart(data);
      return data;
    },
    staleTime: Infinity,
  });

  //Добавление в корзину:
  const { mutate: addToCart } = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity?: number }) => {
      addToCartLocally(id, quantity); //Для Optimistic UI
      const { data } = await $api.post("/trading/cart/add", {
        motorcycleId: id,
        quantity,
      });
      return data;
    },
    onSuccess: (data) => setCart(data), //Синхронизируем финальное состояние
  });

  return { addToCart, isLoading };
};
