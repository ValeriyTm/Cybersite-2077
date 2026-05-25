//Работа с формами:
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; //Библиотека для связывания Zod и React Hook Form
//Схемы валидации Zod:
import {
  ForgotPasswordSchema,
  type ForgotPasswordType,
} from "@repo/validation";
//API:
import { $api } from "@/shared/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Роутинг:
import { Link } from "react-router";
//Обработчик ошибок формы:
import { handleFormError } from "@/shared/lib";
//Состояния:
import { useAuthSubmit } from "@/features/auth";
//Компоненты:
import { Button, Input } from "@/shared/ui";
//Стили:
import styles from "./ForgotPasswordPage.module.scss";

export const ForgotPasswordPage = () => {
  const { handleAuthSubmit } = useAuthSubmit<ForgotPasswordType>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordType>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      captchaToken: "1",
    },
  });

  //Работа с ошибками формы:
  const onFormError = (errors: FieldErrors<ForgotPasswordType>) =>
    handleFormError(errors, "forgot-password-validation-error");

  const onSubmit = async (data: ForgotPasswordType) => {
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
    <>
      <Helmet>
        <title>Cybersite-2077 | Забыли пароль?</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Восстановление</h1>
          <p>Введите Email, указанный при регистрации</p>
          <form onSubmit={handleSubmit(onSubmit, onFormError)}>
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

          <Link title="Go back" to="/auth" className={styles.backlink}>
            Вернуться к форме
          </Link>

        </div>
      </div>
    </>

  );
};
