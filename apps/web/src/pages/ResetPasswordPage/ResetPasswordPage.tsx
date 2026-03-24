//Роутер:
import { useSearchParams, useNavigate } from "react-router";
//React Hook Form:
import { useForm } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Google reCAPTCHA v3:
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
//Схемы валидации Zod:
import { ResetPasswordSchema, type ResetPasswordInput } from "@repo/validation";
//Экземпляр axios:
import { $api } from "@/shared/api/api";
//Библиотека всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Компоненты:
import { PasswordField } from "@/shared/ui/PasswordField";
import { Button } from "@/shared/ui/Button";
//Кастомные хуки:
import { useAuthSubmit } from "@/features/auth/lib/useAuthSubmit";
//Стили:
import styles from "./ResetPages.module.scss";

export const ResetPasswordPage = () => {
  //Извлекаем токен из параметров в адресной строке:
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { handleAuthSubmit } = useAuthSubmit<ResetPasswordInput>();

  const navigate = useNavigate();

  //Подключаем Google Captcha (функция executeRecaptcha будет генерировать невидимый токен проверки):
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      captchaToken: "",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    //Если в параметрах адресной строки нет токена сброса:
    if (!token) return toast.error("Токен отсутствует");

    await handleAuthSubmit(
      {
        action: "reset_password",
        apiCall: (payload) =>
          $api.post(`/identity/auth/reset-password?token=${token}`, payload),
        successMessage: "Пароль успешно изменен!",
        redirectPath: "/auth?activated=true",
      },
      data,
    );
  };

  if (!token)
    return (
      <div className={styles.container}>
        <h1>Токен не найден</h1>
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Новый пароль</h1>
        <p className={styles.subText}>
          Придумайте сложный пароль для защиты аккаунта
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Используем PasswordField для основного пароля */}
          <PasswordField
            label="Новый пароль"
            // placeholder="Введите новый пароль"
            registration={register("password")}
            error={errors.password}
          />

          {/* Используем PasswordField для подтверждения */}
          <PasswordField
            label="Повторите пароль"
            // placeholder="Повторите новый пароль"
            registration={register("confirmPassword")}
            error={errors.confirmPassword}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Сохранение..."
          >
            Обновить пароль
          </Button>
        </form>
      </div>
    </div>
  );
};
