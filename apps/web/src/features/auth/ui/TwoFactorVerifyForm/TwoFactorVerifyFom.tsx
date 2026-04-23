//Работа с формам:
import { useForm } from "react-hook-form";
//Валидация:
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
//Состояния:
import { useAuthStore } from "@/features/auth";
//API:
import { $api } from "@/shared/api";
//Компоненты:
import { Button, Input } from "@/shared/ui";
//Уведомления:
import { toast } from "react-hot-toast";
//Стили:
import styles from "./TwoFactorVerifyFom.module.scss";

// 1. Схема валидации только для кода
const Verify2FASchema = z.object({
  code: z
    .string()
    .length(6, "Код должен содержать ровно 6 цифр")
    .regex(/^\d+$/, "Только цифры"),
});

type Verify2FAInput = z.infer<typeof Verify2FASchema>;

interface Props {
  userId: string | null;
  onSuccess: () => void;
}

export const TwoFactorVerifyForm = ({ userId, onSuccess }: Props) => {
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Verify2FAInput>({
    resolver: zodResolver(Verify2FASchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (data: Verify2FAInput) => {
    if (!userId) return toast.error("Ошибка идентификации пользователя");

    try {
      const res = await $api.post("/identity/auth/2fa/verify", {
        userId,
        code: data.code,
      });

      if (res.data.accessToken) {
        setAuth(res.data.accessToken);
        toast.success("Вход выполнен успешно!");

        onSuccess();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Неверный код подтверждения");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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
