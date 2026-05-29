//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";

export const useAdminTicketsStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      $api.patch(`/admin/tickets/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast.success("Статус обновлен");
    },
  });
};
