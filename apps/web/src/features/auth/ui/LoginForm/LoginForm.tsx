import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@repo/validation";
import { HiEye, HiEyeOff } from "react-icons/hi";
import styles from "../AuthCard/AuthCard.module.scss";

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      // 2. Отправляем запрос на твой новый эндпоинт
      const response = await axios.post(
        "http://localhost:3001/api/identity/auth/login",
        data,
      );

      // Если всё ок, выводим сообщение (позже будем сохранять пользователя в стейт)
      alert(response.data.message);
      console.log("User data:", response.data.user);
    } catch (error: any) {
      // 3. Обработка ошибок с бэкенда
      const message = error.response?.data?.message || "Ошибка входа";

      // Если это ошибка про активацию почты — выведем её красиво
      alert(message);

      // Если хочешь подсветить поле ошибки через setError:
      // setError("email", { message });
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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
        <div className={styles.labelWithLink}>
          <label>Password</label>
          <a href="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </a>
        </div>
        <div className={styles.passwordWrapper}>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
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
          <span className={styles.errorText}>{errors.password.message}</span>
        )}
      </div>

      {/* Ряд с "Запомнить меня" */}
      <div className={styles.optionsRow}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" {...register("rememberMe")} />
          <span>Remember me</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitBtn}
      >
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
};
