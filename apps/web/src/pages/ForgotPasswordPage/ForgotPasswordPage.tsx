//React Hook Form:
import { useForm } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";

//Схемы валидации Zod:
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@repo/validation";
//Экземпляр axios:
import { $api } from "@/shared/api/api";

//Роутер:
import { Link } from "react-router";
//Кастомные хуки:
import { useAuthSubmit } from "@/features/auth/lib/useAuthSubmit";
//Компоненты:
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
//Стили:
import styles from "../ResetPasswordPage/ResetPages.module.scss";

export const ForgotPasswordPage = () => {
  const { handleAuthSubmit } = useAuthSubmit<ForgotPasswordInput>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      captchaToken: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    await handleAuthSubmit(
      {
        action: "forgot_password",
        apiCall: (payload) =>
          $api.post("/identity/auth/forgot-password", payload),
        successMessage:
          "Если аккаунт существует, письмо со ссылкой отправлено!",
        onSuccess: () => {
          // Очищаем инпут после успешной отправки
          reset();
        },
      },
      data,
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Восстановление</h1>
        <p>Введите Email, указанный при регистрации</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            placeholder="mail@example.com"
            registration={register("email")}
            error={errors.email}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Отправка..."
          >
            Получить ссылку
          </Button>
        </form>
        <Link title="Go back" to="/auth" className={styles.backLink}>
          Вернуться к логину
        </Link>
      </div>
    </div>
  );
};
