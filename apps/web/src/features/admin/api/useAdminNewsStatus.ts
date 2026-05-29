//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";

export const useAdminNewsStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      $api.patch(`/admin/news/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("Статус новости изменен");
    },
    onError: () => toast.error("Не удалось изменить статус"),
  });
};
