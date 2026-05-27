//Состояние:
import { useTradingStore } from "@/entities/trading";
import { useOrderStore } from "./useOrderStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//Навигация:
import { useNavigate } from "react-router";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { DeliveryInfo } from "../types/types";
//Уведомления:
import toast from "react-hot-toast";

interface CreateOrderPayload {
  items: { id: string; model: string; price: number; quantity: number }[];
  address: string;
  coords: { lat: number; lng: number } | null;
  deliveryInfo: DeliveryInfo;
  promoCode: string | null;
  totalPrice: number;
  shouldPay: boolean;
}

export const useCreateOrder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { fetchActiveCount } = useOrderStore();

  return useMutation({
    mutationFn: (orderData: CreateOrderPayload) =>
      $api.post("/orders", orderData),
    onSuccess: (res, variables) => {
      //Чистим кэш и клиенский стор корзины от купленных товаров:
      const { cartItems, setCart } = useTradingStore.getState();
      const remainingItems = cartItems.filter((item) => !item.selected);

      queryClient.setQueryData(["cart"], remainingItems);
      setCart(remainingItems);

      fetchActiveCount();

      if (variables.shouldPay && res.data.paymentUrl) {
        window.open(res.data.paymentUrl, "_blank");
      } else {
        toast.success("Заказ оформлен!");
      }

      navigate("/orders/my", { replace: true });
    },
    onError: () => {
      toast.error("Ошибка при создании заказа");
    },
  });
};
