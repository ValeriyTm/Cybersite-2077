import { useQueryClient, useMutation } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";
//Типы:
import type { OrderStatusUp } from "@/entities/admin/types/types";

interface UpdateStatusPayload {
  id: string;
  status: OrderStatusUp;
}

export const useAdminOrdersStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UpdateStatusPayload>({
    mutationFn: ({ id, status }) =>
      $api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Статус обновлен");
    },
  });
};
