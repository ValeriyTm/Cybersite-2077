//Работа с формами:
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; //Библиотека для связывания Zod и React Hook Form
//Схемы валидации Zod:
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@repo/validation";
//API:
import { $api } from "@/shared/api/api";
//Роутинг:
import { Link } from "react-router";
//Состояния:
import { useAuthSubmit } from "@/features/auth/lib/useAuthSubmit";
//Компоненты:
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
//Стили:
import styles from "./ForgotPasswordPage.module.scss";

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
          Вернуться к форме
        </Link>
      </div>
    </div>
  );
};
