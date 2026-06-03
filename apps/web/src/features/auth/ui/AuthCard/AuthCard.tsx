//Состояния:
import { GoogleAuthButton, useAuthStore } from "@/features/auth";
import { useState, useEffect } from "react";
//Роутинг:
import { useNavigate, useSearchParams } from "react-router";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { LoginForm } from "../LoginForm";
import { RegisterForm } from "../RegisterForm";
//Стили:
import styles from "./AuthCard.module.scss";

interface AuthCardProps {
  initialMode?: "login" | "register";
}

export const AuthCard = ({ initialMode }: AuthCardProps) => {
  //Извлекаем параметры из адресной строки (например, ?activated=true или ?token=abc).)
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const { isAuth } = useAuthStore();

  //Логика определения режима (Login/Register) (извлекаем параметры из URL):
  const isActivated = searchParams.get("activated") === "true";


  //Если в URL есть токен (после Google) или флаг активации, сразу показываем форму «Входа» (login), иначе — «Регистрацию»:
  const [mode, setMode] = useState<"login" | "register">(
    initialMode || (isActivated ? "login" : "register"),
  );

  // Если пользователь уже залогинился (или уже был залогинен), уводим его отсюда (редирект) сразу на страницу профиля:
  useEffect(() => {
    if (isAuth) {
      navigate("/profile", { replace: true });
    }
  }, [isAuth, navigate]);
  //Функция роутера navigate добавлена в массив для порядка (требование правил React Hooks), но на деле она стабильна и сама по себе повторных запусков не вызывает.


  if (isAuth) return null;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Авторизация</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className={styles.container}>
        {/* Общий переключатель форм логина-регистрации:*/}
        <div className={styles.toggleWrapper}>
          <button
            className={`${styles.toggleButton} ${mode === "register" ? styles.isActive : ""}`}
            onClick={() => setMode("register")}
          >
            Регистрация
          </button>

          <button
            className={`${styles.toggleButton} ${mode === "login" ? styles.isActive : ""}`}
            onClick={() => setMode("login")}
          >
            Вход
          </button>
        </div>

        <div className={styles.formCard}>
          <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>
          {mode === "register" && (<p className={styles.error}>Регистрация недоступна во избежание нарушения 152ФЗ</p>)}
          {mode === "login" && (<p className={styles.data}>login: watcher@example.com</p>)}
          {mode === "login" && (<p className={styles.data}>password: aaaAAA111!</p>)}

          <GoogleAuthButton
            mode={mode}
          />

          <div className={styles.divider}>
            <span>ИЛИ</span>
          </div>
          {/* Рендерим нужную форму: */}
          {mode === "login" ? (
            <LoginForm onSuccess={() => { }} onVerify2FA={() => { }} />
          ) : (
            <RegisterForm />
          )}
        </div>
      </div>
    </>
  );
};
