import { useState } from "react";
import { LoginForm } from "../LoginForm";
import { RegisterForm } from "../RegisterForm";
import { FcGoogle } from "react-icons/fc";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/model/auth-store";
import styles from "./AuthCard.module.scss";

export const AuthCard = () => {
  const [mode, setMode] = useState<"login" | "register">("register");

  const isAuth = useAuth((state) => state.isAuth);
  const navigate = useNavigate();

  // Если пользователь залогинился (или уже был залогинен), уводим его отсюда
  useEffect(() => {
    if (isAuth) {
      navigate("/profile", { replace: true });
    }
  }, [isAuth, navigate]);

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

        <button className={styles.googleBtn} type="button">
          <FcGoogle />
          <span>
            {mode === "login" ? "Log in with Google" : "Sign up with Google"}
          </span>
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        {/* Рендерим нужную форму */}
        {mode === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
};
