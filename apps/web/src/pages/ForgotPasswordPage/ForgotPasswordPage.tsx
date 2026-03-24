//React Hook Form:
import { useForm } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Google reCAPTCHA v3:
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
//Схемы валидации Zod:
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@repo/validation";
//Экземпляр axios:
import { $api } from "@/shared/api/api";
//Библиотека всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Роутер:
import { Link } from "react-router";
//Кастомные хуки:
import { useAuthSubmit } from "@/features/auth/lib/useAuthSubmit";
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
          <input
            {...register("email")}
            placeholder="mail@example.com"
            className={errors.email ? styles.inputError : ""}
          />
          {errors.email && (
            <span className={styles.error}>{errors.email.message}</span>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Отправка..." : "Получить ссылку"}
          </button>
        </form>
        <Link title="Go back" to="/auth" className={styles.backLink}>
          Вернуться к логину
        </Link>
      </div>
    </div>
  );
};
