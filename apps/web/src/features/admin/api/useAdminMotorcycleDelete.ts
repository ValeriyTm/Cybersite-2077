import { useMutation, useQueryClient } from "@tanstack/react-query";
//Уведомления:
import { toast } from "react-hot-toast";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { AxiosError } from "axios";

interface ApiErrorData {
  message?: string;
}

export const useAdminMotorcycleDelete = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorData>, string>({
    mutationFn: async (id: string) => {
      await $api.delete(`/admin/motorcycles/${id}`);
    },
    onSuccess: () => {
      toast.success("Мотоцикл успешно удален");
      queryClient.invalidateQueries({ queryKey: ["admin-motorcycles"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Не удалось удалить мотоцикл",
      );
    },
  });
};
