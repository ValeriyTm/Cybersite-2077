import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrderStore } from "./useOrderStore";
//API:
import { $api } from "@/shared/api";

export const useCompleteOrder = () => {
  const queryClient = useQueryClient();
  const { fetchActiveCount } = useOrderStore();

  return useMutation({
    mutationFn: (orderId: string) =>
      $api.patch(`/orders/${orderId}/complete`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      // Обновляем счетчик активных заказов:
      fetchActiveCount();
    },
  });
};
