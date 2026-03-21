import { useState } from "react";
import { useForm } from "react-hook-form";
// import axios from "axios";
import { type SubmitHandler } from "react-hook-form";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@repo/validation";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { $api } from "@/shared/api/api";
import { useAuthStore } from "@/features/auth/model/auth-store";
import styles from "../AuthCard/AuthCard.module.scss";

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth, tempUserId, setTempUserId } = useAuthStore();
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false, // Инициализируем значения по умолчанию
    },
  });

  // const { setAuth } = useAuthStore();
  // const { setTempUserId } = useAuthStore();

  // 1. Обработка ПЕРВОГО шага (Email + Password)
  const onSubmit: SubmitHandler<LoginInput> = async (data: LoginInput) => {
    try {
      const res = await $api.post("/identity/auth/login", data);

      // Если бэкенд говорит, что нужен код:
      if (res.data.requires2FA) {
        setTempUserId(res.data.userId); // Сохраняем ID в стор
        setShow2FA(true); // Переключаем интерфейс
        toast.success("Введите 6-значный код из приложения");
        return;
      }

      // Если 2FA не нужен — обычный вход
      setAuth(res.data.accessToken);
      toast.success("С возвращением!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка входа");
    }
  };

  // 2. Обработка ВТОРОГО шага (Ввод кода 2FA)
  const onVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) return toast.error("Введите 6 цифр");

    setIsVerifying(true);
    try {
      const res = await $api.post("/identity/auth/2fa/verify", {
        userId: tempUserId,
        code: twoFactorCode,
      });

      setAuth(res.data.accessToken);
      toast.success("Личность подтверждена!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Неверный код");
    } finally {
      setIsVerifying(false);
    }
  };

  // ЕСЛИ НУЖЕН 2FA — ПОКАЗЫВАЕМ ТОЛЬКО ПОЛЕ ДЛЯ КОДА
  if (show2FA) {
    return (
      <form onSubmit={onVerify2FA} className={styles.form}>
        <div className={styles.field}>
          <label>Двухфакторная аутентификация</label>
          <p className={styles.subText}>
            Введите код из Aegis / Google Authenticator
          </p>
          <input
            type="text"
            value={twoFactorCode}
            onChange={(e) =>
              setTwoFactorCode(e.target.value.replace(/\D/g, ""))
            }
            placeholder="000 000"
            maxLength={6}
            className={styles.inputCenter}
            autoFocus
          />
        </div>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isVerifying}
        >
          {isVerifying ? "Проверка..." : "Войти"}
        </button>
        <button
          type="button"
          onClick={() => setShow2FA(false)}
          className={styles.backBtn}
        >
          Вернуться назад
        </button>
      </form>
    );
  }

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
