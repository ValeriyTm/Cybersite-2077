//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";

export const useAdminDiscountsGeneration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.post("/discount/force-generate"),
    onSuccess: () => {
      toast.success("Массовая генерация запущена!");
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
        queryClient.invalidateQueries({ queryKey: ["admin-personal"] });
      }, 2000); //Даем время воркерам отработать
    },
  });
};
