//Состояния:
import { useMutation } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";

export const useAdminSyncDB = () => {
  return useMutation({
    mutationFn: () => $api.post("/admin/sync-search/global"),
    onMutate: () => {
      toast.loading("Запущена полная переиндексация...", { id: "sync" });
    },
    onSuccess: () => {
      toast.success("Поиск полностью синхронизирован!", { id: "sync" });
    },
    onError: () => {
      toast.error("Ошибка при синхронизации", { id: "sync" });
    },
  });
};
