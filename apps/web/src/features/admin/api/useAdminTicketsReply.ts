//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { Ticket } from "@/entities/support/types/types";
//Уведомления:
import toast from "react-hot-toast";

interface UseAdminTicketsReplyProps {
  selectedTicket: Ticket | null;
  setSelectedTicket: (data: Ticket | null) => void;
}

// Типы для аргументов, которые мы передаем в метод .mutate()
interface ReplyMutationVariables {
  answer: string;
  onSuccessCallback?: () => void;
}

export const useAdminTicketsReply = ({
  selectedTicket,
  setSelectedTicket,
}: UseAdminTicketsReplyProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ answer }: ReplyMutationVariables) =>
      $api.patch(`/admin/tickets/${selectedTicket!.id}/reply`, { answer }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      setSelectedTicket(null);

      if (variables.onSuccessCallback) {
        variables.onSuccessCallback();
      }
      toast.success("Ответ успешно отправлен");
    },
    onError: () => toast.error("Ошибка при отправке ответа"),
  });
};
