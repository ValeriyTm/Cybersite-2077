//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { Role } from "@repo/database/generated/prisma/client";
//Уведомления:
import toast from "react-hot-toast";

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useAdminUsersStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      $api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Роль обновлена");
    },
    onError: (err: unknown) => {
      const error = err as ApiErrorResponse;
      toast.error(error.response?.data?.message || "Ошибка");
    },
  });
};
