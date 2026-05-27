import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";

export const useCreateReview = (onSuccessCallback: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => $api.post("/reviews", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Отзыв успешно опубликован!");
      onSuccessCallback();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Ошибка при отправке отзыва";
      toast.error(message);
    },
  });
};
