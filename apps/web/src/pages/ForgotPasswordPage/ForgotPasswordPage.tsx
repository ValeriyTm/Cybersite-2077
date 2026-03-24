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
//Стили:
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
    //1) Ждем токен от Google.  Если сервис капчи не прогрузился, регистрация блокируется.
    if (!executeRecaptcha) {
      toast.error("Капча еще не загружена");
      return;
    }

    try {
      //2) Получаем токен действия 'forgot_password':
      const captchaToken = await executeRecaptcha("forgot_password");

      //3) Отправляем на сервер данные:
      await $api.post("/identity/auth/forgot-password", {
        ...data,
        //Прикладываем токен капчи:
        captchaToken,
      });

      toast.success("Если аккаунт существует, письмо со ссылкой отправлено!");
      //Обнуляем форму:
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
