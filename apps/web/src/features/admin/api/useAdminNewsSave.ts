//Состояния:
import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { News } from "@/entities/content";
//Уведомления:
import toast from "react-hot-toast";

interface useAdminNewsSaveProps {
  editingNews: News | null;
  setIsModalOpen: (data: boolean) => void;
}

export const useAdminNewsSave = ({
  editingNews,
  setIsModalOpen,
}: useAdminNewsSaveProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      editingNews
        ? $api.patch(`/admin/news/${editingNews._id}`, formData)
        : $api.post("/admin/news", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      setIsModalOpen(false);
      toast.success("Новость сохранена");
    },
    onError: () => toast.error("Ошибка при сохранении"),
  });
};
