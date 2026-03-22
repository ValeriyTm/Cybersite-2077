import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@repo/validation";
import { $api } from "@/shared/api/api";
import { toast } from "react-hot-toast";
import { Link } from "react-router";
import styles from "../ResetPasswordPage/ResetPages.module.scss";

export const ForgotPasswordPage = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

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
    if (!executeRecaptcha) {
      toast.error("Капча еще не загружена");
      return;
    }

    try {
      // Получаем токен действия 'forgot_password'
      const captchaToken = await executeRecaptcha("forgot_password");

      await $api.post("/identity/auth/forgot-password", {
        ...data,
        captchaToken,
      });
      toast.success("Если аккаунт существует, письмо со ссылкой отправлено!");
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка запроса");
    }
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
