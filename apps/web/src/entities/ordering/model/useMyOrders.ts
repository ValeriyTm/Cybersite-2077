import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { Order } from "@/entities/ordering/types/types";

export const useMyOrders = (statusFilter: string | undefined) => {
  return useQuery<Order[]>({
    queryKey: ["my-orders", statusFilter],
    queryFn: () =>
      $api
        .get("/orders/my", { params: { status: statusFilter } })
        .then((res) => res.data),
    refetchInterval: 30 * 1000, // Автоматический опрос бэка каждые 30 секунд для обновления статусов доставки
    refetchOnWindowFocus: true, //Также обновлять, когда окно браузера снова становится активным
  });
};
