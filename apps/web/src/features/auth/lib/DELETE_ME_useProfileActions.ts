import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { UpdateProfileSchema, type UpdateProfileInput } from "@repo/validation";
import { useAuthSubmit } from "./useAuthSubmit";
import { $api } from "@/shared/api/api";
import { type IUser } from "@repo/types";

export const useProfileActions = (user: IUser | null | undefined) => {
  const queryClient = useQueryClient(); // Доступ к кэшу React Query
  const { handleAuthSubmit } = useAuthSubmit<UpdateProfileInput>();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: user?.name || "", // Подставляем имя из пропсов (Пункт 4.8)
    },
    // Пересобираем форму, когда данные пользователя загрузились (важно для UX)
    values: {
      name: user?.name || "",
    },
  });

  const onUpdateProfile = async (data: UpdateProfileInput) => {
    await handleAuthSubmit(
      {
        action: "update_profile",
        apiCall: (payload) => $api.patch("/identity/profile/update", payload),
        successMessage: "Профиль обновлен",
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
      },
      data,
    );
  };

  return {
    profileForm,
    onUpdateProfile,
  };
};
