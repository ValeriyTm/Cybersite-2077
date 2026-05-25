//Типы:
import type { FieldErrors, FieldValues } from "react-hook-form";
//Уведомления:
import { toast } from "react-hot-toast";

export const handleFormError = <T extends FieldValues>(
  errors: FieldErrors<T>,
  toastId: string,
) => {
  const firstError = Object.values(errors)[0];
  if (firstError?.message) {
    toast.error(firstError.message as string, { id: toastId });
  }
};
