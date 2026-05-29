//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";

export const useAdminNewsDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => $api.delete(`/admin/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("Новость успешно удалена");
    },
    onError: () => toast.error("Ошибка при удалении новости"),
  });
};
