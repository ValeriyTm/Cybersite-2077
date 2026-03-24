import { useState } from "react"; // 1. Добавляем useState
import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { ResetPasswordSchema, type ResetPasswordInput } from "@repo/validation";
import { $api } from "@/shared/api/api";
import { toast } from "react-hot-toast";
import { PasswordField } from "@/shared/ui/PasswordField";
import styles from "./ResetPages.module.scss";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

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
    //1) Ждем токен от Google.  Если сервис капчи не прогрузился, регистрация блокируется.
    if (!executeRecaptcha) {
      toast.error("Капча еще не загружена");
      return;
    }

    //Если в параметрах адресной строки нет токена сброса:
    if (!token) return toast.error("Токен отсутствует");

    try {
      //2) Получаем токен действия 'reset_password'
      const captchaToken = await executeRecaptcha("reset_password");

      //3) Отправляем на сервер данные:
      await $api.post(`/identity/auth/reset-password?token=${token}`, {
        ...data,
        //Прикладываем токен капчи:
        captchaToken,
      });

      toast.success("Пароль изменен!");
      //Редирект пользователя:
      navigate("/auth?activated=true");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка");
    }
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

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? "Сохранение..." : "Сбросить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
};
