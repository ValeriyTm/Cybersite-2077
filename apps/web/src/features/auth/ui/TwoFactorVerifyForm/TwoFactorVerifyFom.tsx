//Работа с формам:
import { useForm, type FieldErrors } from "react-hook-form";
//Валидация:
import { zodResolver } from "@hookform/resolvers/zod";
//Валидация:
import { Verify2FASchema, type Verify2FAType } from "@repo/validation";
//Состояния:
import { useAuthStore } from "@/features/auth";
import { useState } from "react";
//API:
import { $api } from "@/shared/api";
//Компоненты:
import { Button, Input } from "@/shared/ui";
//Уведомления:
import { toast } from "react-hot-toast";
//Стили:
import styles from "./TwoFactorVerifyFom.module.scss";

//Структура ошибки от сервера:
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Props {
  userId: string | null;
  onSuccess: () => void;
}

export const TwoFactorVerifyForm = ({ userId, onSuccess }: Props) => {
  const { setAuth } = useAuthStore();

  const [localUserId] = useState<string | null>(userId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Verify2FAType>({
    resolver: zodResolver(Verify2FASchema),
    mode: "onBlur",
    defaultValues: { code: "" },
  });

  //Функция для обработки ошибок валидации Zod:
  const onFormError = (errors: FieldErrors<Verify2FAType>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message, {
        id: "2fa-validation-error", // Предотвращает спам уведомлениями
      });
    }
  };

  const onSubmit = async (data: Verify2FAType) => {
    if (!localUserId) return toast.error("Ошибка идентификации пользователя");

    try {
      const res = await $api.post("/identity/auth/2fa/verify", {
        userId: localUserId,
        code: String(data.code),
      });

      if (res.data.accessToken) {
        setAuth(res.data.accessToken);
        toast.success("Вход выполнен успешно!");

        onSuccess();
      }
    } catch (e: unknown) {
      const error = e as ApiErrorResponse;
      toast.error(error.response?.data?.message || "Неверный код подтверждения");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)} className={styles.form}>
      <div className={styles.header}>
        <h3>Второй этап входа</h3>
        <p>
          Защита аккаунта включена. Введите код из приложения-аутентификатора.
        </p>
      </div>

      <Input
        label="Код из приложения"
        placeholder="000000"
        registration={register("code")}
        error={errors.code}
        maxLength={6}
        autoFocus
        // Добавляем специфический стиль для OTP, если нужно
        className={styles.otpInput}
      />

      <Button type="submit" isLoading={isSubmitting} loadingText="Проверка...">
        Подтвердить и войти
      </Button>
    </form>
  );
};
