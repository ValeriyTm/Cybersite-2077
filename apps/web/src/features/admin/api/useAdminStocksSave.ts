import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";
//Типы:
import type { Stock } from "@/entities/admin/types/types";

interface UseAdminStocksSaveProps {
  setIsModalOpen: (data: boolean) => void;
  editingStock: Stock | null;
}

export const useAdminStocksSave = ({
  setIsModalOpen,
  editingStock,
}: UseAdminStocksSaveProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (val: number) =>
      $api.patch(`/admin/stocks/${editingStock!.id}`, { quantity: val }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stocks"] });
      setIsModalOpen(false);
      toast.success("Запасы обновлены");
    },
  });
};
