//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";

// Структура стандартной ошибки от сервера:
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useAdminUsersDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => $api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Пользователь удален");
    },
    onError: (err: unknown) => {
      const error = err as ApiErrorResponse;
      toast.error(error.response?.data?.message || "Ошибка при удалении");
    },
  });
};
