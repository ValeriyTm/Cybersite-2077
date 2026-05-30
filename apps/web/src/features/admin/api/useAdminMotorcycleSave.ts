import { useMutation, useQueryClient } from "@tanstack/react-query";
//Уведомления:
import { toast } from "react-hot-toast";
//Типы:
import type { MotorcycleEditAdmin } from "@/entities/catalog";
//API:
import { $api } from "@/shared/api";
import type { AxiosError } from "axios";

interface UseSaveMotoProps {
  editingMoto: MotorcycleEditAdmin | null;
  setIsModalOpen: (isOpen: boolean) => void;
}

interface ServerValidationError {
  path: string;
  message: string;
}

interface ApiValidationErrorResponse {
  errors?: ServerValidationError[];
}

export const useAdminMotorcycleSave = ({
  editingMoto,
  setIsModalOpen,
}: UseSaveMotoProps) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, AxiosError<ApiValidationErrorResponse>, FormData>(
    {
      mutationFn: (formData) =>
        editingMoto
          ? $api.patch(`/admin/motorcycles/${editingMoto.id}`, formData)
          : $api.post("/admin/motorcycles", formData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-motorcycles"] });
        setIsModalOpen(false);
        toast.success("Данные обновлены");
      },
      onError: (error) => {
        //Массив ошибок из ответа сервера:
        const serverErrors = error.response?.data?.errors;

        if (serverErrors && Array.isArray(serverErrors)) {
          //Перебираем и выводим каждую ошибку отдельно:
          serverErrors.forEach((err) => {
            toast.error(
              `Ошибка в поле [${err.path.replace(/^body\./, "")}]: ${err.message}`,
            );
          });
        } else {
          //Резервный лог на случай других ошибок (сеть, 500 и т.д.):
          toast.error(`Произошла неизвестная ошибка: ${error.message}`);
        }
      },
    },
  );
};
