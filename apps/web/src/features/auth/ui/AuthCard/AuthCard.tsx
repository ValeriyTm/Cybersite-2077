//Состояния:
import { GoogleAuthButton, useAuthStore, useProfile } from "@/features/auth";
import { useState, useEffect, useRef } from "react";
//Роутинг:
import { useNavigate, useSearchParams, useLocation } from "react-router";
//Библиотека для показа всплывающих уведомлений:
import { toast } from "react-hot-toast";
//API:
import { API_URL } from "@/shared/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { LoginForm } from "../LoginForm";
import { RegisterForm } from "../RegisterForm";
//Стили:
import styles from "./AuthCard.module.scss";

//Для пропсов (нужны для работы Storybook):
interface AuthCardProps {
  initialMode?: "login" | "register";
}

export const AuthCard = ({ initialMode }: AuthCardProps) => {
  //Извлекаем параметры из адресной строки (например, ?activated=true или ?token=abc).)
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();

  const { isAuth, setAuth } = useAuthStore();
  const { refetch } = useProfile();

  //Логика определения режима (Login/Register) (извлекаем параметры из URL):
  const isActivated = searchParams.get("activated") === "true";
  const tokenFromUrl = searchParams.get("token");

  // Флаг, чтобы гарантировать однократную обработку токена из URL
  const processingToken = useRef(false);

  //Если в URL есть токен (после Google) или флаг активации, сразу показываем форму «Входа» (login), иначе — «Регистрацию»:
  const [mode, setMode] = useState<"login" | "register">(
    initialMode || (isActivated || !!tokenFromUrl ? "login" : "register"),
  );

  // Если пользователь уже залогинился (или уже был залогинен), уводим его отсюда (редирект) сразу на страницу профиля:
  useEffect(() => {
    if (isAuth && !tokenFromUrl) {
      navigate("/profile", { replace: true });
    }
  }, [isAuth, navigate, tokenFromUrl]);
  //Функция роутера navigate добавлена в массив для порядка (требование правил React Hooks), но на деле она стабильна и сама по себе повторных запусков не вызывает.


  //Обработка успешного OAuth (если вернулись с токеном в URL):
  useEffect(() => {
    //Если в ссылке есть токен (Google вернул пользователя на фронтенд):
    if (tokenFromUrl && !isAuth && !processingToken.current) {
      // Сначала сохраняем токен в клиентском сторе:
      setAuth(tokenFromUrl);

      // Затем заставляем React Query скачать данные пользователя с сервера:
      refetch().then(() => {
        toast.success("Вход через Google выполнен!");
        navigate("/profile", { replace: true });
      }).catch(() => {
        toast.error("Ошибка обновления профиля");
        processingToken.current = false;
      });
    }
  }, [tokenFromUrl, isAuth, setAuth, refetch, navigate]);
  //tokenFromUrl и isAuth - прямые зависимости. setAuth, refetch, navigate - это функции, а в React принято добавлять их в зависимости, если они используются внутри useEffect.

  //Уведомление об активации почты (если состояние активации меняется, то выводим уведомление):
  useEffect(() => {
    //Проверяем, что параметр isActivated есть, и мы находимся именно на странице авторизации
    if (isActivated && location.pathname === "/auth") {
      toast.success("Почта подтверждена! Теперь вы можете войти", {
        id: "activation-success",
      });
    }
  }, [isActivated, location.pathname]);

  //Функция ухода на Google OAuth (Бэкенд-эндпоинт):
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/identity/auth/google`;
    //Используем window.location.href, так как это переход на другой домен, а не внутренний роут.
  };

  if (isAuth && !tokenFromUrl) return null;

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

          <GoogleAuthButton
            mode={mode}
            onClick={handleGoogleLogin}
          />

          <div className={styles.divider}>
            <span>ИЛИ</span>
          </div>
          {/* Рендерим нужную форму: */}
          {mode === "login" ? (
            <LoginForm onSuccess={() => { }} onVerify2FA={() => { }} />
          ) : (
            <RegisterForm onSuccess={() => setMode("login")} />
          )}
        </div>
      </div>
    </>
  );
};
