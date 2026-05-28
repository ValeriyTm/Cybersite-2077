import { useMutation, useQueryClient } from "@tanstack/react-query";
//Уведомления:
import { toast } from "react-hot-toast";
//API:
import { $api } from "@/shared/api";

export const useAdminMotorcycleDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await $api.delete(`/admin/motorcycles/${id}`);
    },
    onSuccess: () => {
      toast.success("Мотоцикл успешно удален");
      queryClient.invalidateQueries({ queryKey: ["admin-motorcycles"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Не удалось удалить мотоцикл",
      );
    },
  });
};
