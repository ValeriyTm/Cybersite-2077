import { useMutation, useQueryClient } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import { type BrandData } from "@/entities/catalog";
//Уведомления:
import { toast } from "react-hot-toast";

interface UseSaveBrandProps {
  editingBrand: BrandData | null;
  setIsModalOpen: (isOpen: boolean) => void;
  setEditingBrand: (brand: BrandData | null) => void;
}

export const useAdminBrandSave = ({
  editingBrand,
  setIsModalOpen,
  setEditingBrand,
}: UseSaveBrandProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: BrandData) =>
      editingBrand
        ? $api.patch(`/admin/brands/${editingBrand.id}`, formData)
        : $api.post("/admin/brands", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      setIsModalOpen(false);
      setEditingBrand(null);
      toast.success("Успешно сохранено");
    },
  });
};
