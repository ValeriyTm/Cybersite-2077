import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import { toast } from "react-hot-toast";

export const useAdminBrandDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => $api.delete(`/admin/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] }); //Обновляем таблицу
      toast.success("Бренд удален");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
};
