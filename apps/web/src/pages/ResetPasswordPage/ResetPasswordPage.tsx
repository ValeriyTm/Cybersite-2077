import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordSchema, type ResetPasswordInput } from "@repo/validation";
import { $api } from "@/shared/api/api";
import { toast } from "react-hot-toast";
import styles from "./ResetPages.module.scss";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) return toast.error("Токен отсутствует");

    try {
      // Отправляем токен в query-параметре, как настроили на бэкенде
      await $api.post(`/identity/auth/reset-password?token=${token}`, data);
      toast.success("Пароль изменен! Теперь вы можете войти.");
      navigate("/auth?activated=true"); // Сделаем автоматический переход в Login mode
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ссылка устарела");
    }
  };

  if (!token)
    return (
      <div className={styles.container}>
        <h1>Ошибка: Токен не найден</h1>
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Новый пароль</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="password"
            {...register("password")}
            placeholder="Новый пароль"
            className={errors.password ? styles.inputError : ""}
          />
          {errors.password && (
            <span className={styles.error}>{errors.password.message}</span>
          )}

          <input
            type="password"
            {...register("confirmPassword")}
            placeholder="Повторите пароль"
            className={errors.confirmPassword ? styles.inputError : ""}
          />
          {errors.confirmPassword && (
            <span className={styles.error}>
              {errors.confirmPassword.message}
            </span>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : "Сбросить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
};
