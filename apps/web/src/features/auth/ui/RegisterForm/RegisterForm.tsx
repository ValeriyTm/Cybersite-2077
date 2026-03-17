import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { RegisterSchema, type RegisterInput } from "@repo/validation";
import styles from "./RegisterForm.module.scss";

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(false); // Toggle между Sign up и Log in

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur", // Валидация при потере фокуса
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/register",
        data,
      );
      alert(response.data.message);
    } catch (error: any) {
      alert(error.response?.data?.message || "Ошибка регистрации");
    }
  };

  return (
    <div className={styles.container}>
      {/* Toggle-кнопка вверху */}
      <div className={styles.toggleWrapper}>
        <button
          className={`${styles.toggleBtn} ${!isLogin ? styles.active : ""}`}
          onClick={() => setIsLogin(false)}
        >
          Sign up
        </button>
        <button
          className={`${styles.toggleBtn} ${isLogin ? styles.active : ""}`}
          onClick={() => setIsLogin(true)}
        >
          Log in
        </button>
      </div>

      <div className={styles.formCard}>
        <h2>{isLogin ? "Log in" : "Sign up"}</h2>

        {/* Google SSO */}
        <button
          className={styles.googleBtn}
          onClick={() => console.log("Google Auth")}
        >
          <img src="/google-icon.svg" alt="Google" />
          <span>{isLogin ? "Log in with Google" : "Sign up with Google"}</span>
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Поле Name (Логин) */}
          {!isLogin && (
            <div className={styles.field}>
              <label>Name</label>
              <input
                {...register("name")}
                placeholder="Your unique name"
                className={errors.name ? styles.inputError : ""}
              />
              {errors.name && (
                <span className={styles.errorText}>{errors.name.message}</span>
              )}
            </div>
          )}

          {/* Поле Email */}
          <div className={styles.field}>
            <label>Email address</label>
            <input
              {...register("email")}
              placeholder="example@mail.com"
              className={errors.email ? styles.inputError : ""}
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email.message}</span>
            )}
          </div>

          {/* Поле Password (его нет на скрине, но оно нужно в схеме) */}
          <div className={styles.field}>
            <label>Password</label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className={errors.password ? styles.inputError : ""}
            />
            {errors.password && (
              <span className={styles.errorText}>
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? "Processing..." : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
};
