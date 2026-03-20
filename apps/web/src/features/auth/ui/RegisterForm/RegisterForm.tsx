import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { HiEye, HiEyeOff } from "react-icons/hi"; // Импорт иконок
import { RegisterFormSchema, type RegisterFormInput } from "@repo/validation";
import styles from "../AuthCard/AuthCard.module.scss";
import { $api } from "@/shared/api/api";

export const RegisterForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterFormSchema),
    mode: "onBlur",
  });

  // Функция, которая сработает, если Zod найдет ошибки
  const onFormError = (errors: any) => {
    // Берем первую попавшуюся ошибку и выводим её в Toast
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message, {
        id: "form-validation-error", // Чтобы тосты не плодились, а заменяли друг друга
      });
    }
  };

  const onSubmit = async (data: RegisterFormInput) => {
    try {
      await $api.post("/identity/auth/register", data);

      // 1. Показываем уведомление
      toast.success(
        "Регистрация успешна! Проверьте почту для активации аккаунта.",
      );

      // 2. Очищаем форму (необязательно, но полезно)
      reset();

      // 3. Редиректим на вкладку логина через 1.5 секунды,
      // чтобы юзер успел прочитать сообщение
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e: any) {
      const message = e.response?.data?.message || "Ошибка при регистрации";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className={styles.field}>
        <label>Name</label>
        <input
          {...register("name")}
          placeholder="Your name"
          className={errors.name ? styles.inputError : ""}
        />
        {errors.name && (
          <span className={styles.errorText}>{errors.name.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label>Email address</label>
        <input
          {...register("email")}
          placeholder="mail@example.com"
          className={errors.email ? styles.inputError : ""}
        />
        {errors.email && (
          <span className={styles.errorText}>{errors.email.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label>Password</label>
        <div className={styles.passwordWrapper}>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
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
          <span className={styles.errorText}>{errors.password.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label>Confirm Password</label>
        <input
          {...register("confirmPassword")}
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <span className={styles.errorText}>
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <div className={styles.checkboxField}>
        <input type="checkbox" id="terms" {...register("acceptTerms")} />
        <label htmlFor="terms">
          Я даю{" "}
          <a href="/terms" target="_blank">
            Согласие на обработку персональных данных
          </a>{" "}
          и принимаю условия{" "}
          <a href="/privacy" target="_blank">
            Политики конфиденциальности
          </a>
        </label>
        {errors.acceptTerms && (
          <span className={styles.errorText}>{errors.acceptTerms.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitBtn}
      >
        {isSubmitting ? "Signing up..." : "Sign up"}
      </button>

      {/* Кнопка сброса */}
      <button
        type="button" // Обязательно button, а не submit!
        onClick={() => reset()}
        className={styles.resetBtn}
        disabled={isSubmitting}
      >
        Clear
      </button>
    </form>
  );
};
