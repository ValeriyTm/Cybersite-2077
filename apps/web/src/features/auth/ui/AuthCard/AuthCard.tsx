import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

import { LoginForm } from "../LoginForm";
import { RegisterForm } from "../RegisterForm";
import { useAuth } from "@/features/auth/model/auth-store";
import styles from "./AuthCard.module.scss";

export const AuthCard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Достаем нужные методы из стора
  const { isAuth, checkAuth } = useAuth();

  //Логика определения режима (Login/Register):
  const isActivated = searchParams.get("activated") === "true";
  const hasToken = !!searchParams.get("token"); // Проверка наличия токена после OAuth

  const [mode, setMode] = useState<"login" | "register">(
    isActivated || hasToken ? "login" : "register",
  );

  //Обработка успешного OAuth (если вернулись с токеном в URL)
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && !isAuth) {
      // Вызываем checkAuth, чтобы подтвердить сессию по куке и загрузить юзера
      checkAuth().then(() => {
        toast.success("Вход через Google выполнен!");
        navigate("/profile", { replace: true });
      });
    }
  }, [searchParams, isAuth, checkAuth, navigate]);

  // Если пользователь залогинился (или уже был залогинен), уводим его отсюда (редирект):
  useEffect(() => {
    if (isAuth) {
      navigate("/profile", { replace: true });
    }
  }, [isAuth, navigate]);

  //Уведомление об активации почты:
  useEffect(() => {
    if (isActivated) {
      toast.success("Почта подтверждена! Теперь вы можете войти", {
        id: "activation-success", // Чтобы не дублировалось
      });
    }
  }, [isActivated]);

  //Функция ухода на Google OAuth (Бэкенд-эндпоинт):
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3001/api/identity/auth/google";
  };

  // Пока идет редирект, можно вернуть null или спиннер
  if (isAuth) return null;

  return (
    <div className={styles.container}>
      {/* Общий переключатель */}
      <div className={styles.toggleWrapper}>
        <button
          className={`${styles.toggleBtn} ${mode === "register" ? styles.active : ""}`}
          onClick={() => setMode("register")}
        >
          Sign up
        </button>
        <button
          className={`${styles.toggleBtn} ${mode === "login" ? styles.active : ""}`}
          onClick={() => setMode("login")}
        >
          Log in
        </button>
      </div>

      <div className={styles.formCard}>
        <h2>{mode === "login" ? "Log in" : "Sign up"}</h2>

        <button
          className={styles.googleBtn}
          type="button"
          onClick={handleGoogleLogin}
        >
          <FcGoogle />
          <span>
            {mode === "login" ? "Log in with Google" : "Sign up with Google"}
          </span>
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>
        {/* Рендерим нужную форму */}
        {/* Передаем функцию переключения в форму регистрации */}
        {mode === "login" ? (
          <LoginForm />
        ) : (
          <RegisterForm onSuccess={() => setMode("login")} />
        )}
      </div>
    </div>
  );
};
