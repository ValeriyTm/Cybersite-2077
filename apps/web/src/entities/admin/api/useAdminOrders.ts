import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type {
  OrderResponse,
  OrderStatusUp,
} from "@/entities/admin/types/types";

export const useAdminOrders = (
  page: number,
  status: OrderStatusUp | "",
  email: string,
) => {
  return useQuery<OrderResponse>({
    queryKey: ["admin-orders", page, status, email],
    queryFn: () =>
      $api
        .get<OrderResponse>("/admin/orders", {
          params: { page, status, email },
        })
        .then((res) => res.data),
  });
};
