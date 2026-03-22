import { useState } from "react"; // 1. Добавляем useState
import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { ResetPasswordSchema, type ResetPasswordInput } from "@repo/validation";
import { $api } from "@/shared/api/api";
import { toast } from "react-hot-toast";
import { HiEye, HiEyeOff } from "react-icons/hi"; // 2. Добавляем иконки
import styles from "./ResetPages.module.scss";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { executeRecaptcha } = useGoogleReCaptcha();

  // 3. Стейт для переключения видимости
  const [showPassword, setShowPassword] = useState(false);

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
    if (!executeRecaptcha) {
      toast.error("Капча еще не загружена");
      return;
    }

    if (!token) return toast.error("Токен отсутствует");

    try {
      // Получаем токен действия 'reset_password'
      const captchaToken = await executeRecaptcha("reset_password");

      await $api.post(`/identity/auth/reset-password?token=${token}`, {
        ...data,
        captchaToken,
      });
      toast.success("Пароль изменен!");
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
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ПОЛЕ 1: Новый пароль */}
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Новый пароль"
              className={errors.password ? styles.inputError : ""}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
          </div>
          {errors.password && (
            <span className={styles.error}>{errors.password.message}</span>
          )}

          {/* ПОЛЕ 2: Повтор пароля */}
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="Повторите пароль"
              className={errors.confirmPassword ? styles.inputError : ""}
            />
          </div>
          {errors.confirmPassword && (
            <span className={styles.error}>
              {errors.confirmPassword.message}
            </span>
          )}

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
