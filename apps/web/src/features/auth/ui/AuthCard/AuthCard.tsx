import { useState, useEffect } from "react";
//Роутер:
import { useNavigate, useSearchParams, useLocation } from "react-router";
//Библиотека для показа всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Иконка:
import { FcGoogle } from "react-icons/fc";
//Компоненты:
import { LoginForm } from "../LoginForm";
import { RegisterForm } from "../RegisterForm";
//Хранилища:
import { useAuthStore } from "@/features/auth/model/useAuthStore"; //Клиентское
import { useProfile } from "@/features/auth/model/useProfile"; //Серверное
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

  //Из клиентского стора берем только статус авторизации и метод его установки:
  const { isAuth, setAuth } = useAuthStore();
  //Из серверного стора берем refetch, чтобы принудительно обновить данные после Google OAuth:
  const { refetch } = useProfile();

  //Логика определения режима (Login/Register) (извлекаем параметры из URL):
  const isActivated = searchParams.get("activated") === "true"; //Проверяем, пришел ли пользователь по ссылке из письма для активации почты.
  const tokenFromUrl = searchParams.get("token"); // Проверка наличия токена после OAuth

  //Если в URL есть токен (после Google) или флаг активации, сразу показываем форму «Входа» (login), иначе — «Регистрацию»:
  const [mode, setMode] = useState<"login" | "register">(
    initialMode || (isActivated || !!tokenFromUrl ? "login" : "register"),
  );

  //Обработка успешного OAuth (если вернулись с токеном в URL):
  useEffect(() => {
    //Если в ссылке есть токен (Google вернул пользователя на фронтенд):
    if (tokenFromUrl && !isAuth) {
      // Сначала сохраняем токен в клиентском сторе:
      setAuth(tokenFromUrl);

      // Затем заставляем React Query скачать данные пользователя с сервера:
      refetch().then(() => {
        toast.success("Вход через Google выполнен!");
        //Редирект на страницу профиля:
        navigate("/profile", { replace: true });
      });
    }
  }, [tokenFromUrl, isAuth, setAuth, refetch, navigate]);
  //tokenFromUrl и isAuth - прямые зависимости. setAuth, refetch, navigate - это функции, а в React принято добавлять их в зависимости, если они используются внутри useEffect.

  // Если пользователь уже залогинился (или уже был залогинен), уводим его отсюда (редирект) сразу на страницу профиля:
  useEffect(() => {
    if (isAuth && !tokenFromUrl) {
      navigate("/profile", { replace: true });
    }
  }, [isAuth, navigate, tokenFromUrl]);
  //Функция роутера navigate добавлена в массив для порядка (требование правил React Hooks), но на деле она стабильна и сама по себе повторных запусков не вызывает.

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
    window.location.href = "http://localhost:3001/api/identity/auth/google";
    //Используем window.location.href, так как это переход на другой домен, а не внутренний роут.
  };

  //Пока идет редирект, можно вернуть null или спиннер
  if (isAuth && !tokenFromUrl) return null;

  const handleSuccess = () => {
    // Что делать, если юзер вошел или зарегистрировался?
    // Например, закрыть модалку или перенаправить на главную:
    console.log("Действие успешно завершено!");
  };

  return (
    <div className={styles.container}>
      {/* Общий переключатель форм логина-регистрации:*/}
      <div className={styles.toggleWrapper}>
        <button
          className={`${styles.toggleBtn} ${mode === "register" ? styles.active : ""}`}
          onClick={() => setMode("register")}
        >
          Регистрация
        </button>

        <button
          className={`${styles.toggleBtn} ${mode === "login" ? styles.active : ""}`}
          onClick={() => setMode("login")}
        >
          Вход
        </button>
      </div>

      <div className={styles.formCard}>
        <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>

        <button
          className={styles.googleBtn}
          type="button"
          onClick={handleGoogleLogin}
        >
          <FcGoogle />
          <span>
            {mode === "login"
              ? "Войти с Google"
              : "Зарегистрироваться с Google"}
          </span>
        </button>

        <div className={styles.divider}>
          <span>ИЛИ</span>
        </div>
        {/* Рендерим нужную форму */}
        {/* Передаем функцию переключения в форму регистрации */}
        {mode === "login" ? (
          <LoginForm onSuccess={handleSuccess} onVerify2FA={handleSuccess} />
        ) : (
          <RegisterForm onSuccess={() => setMode("login")} />
          //onSuccess={() => setMode("login")} — это пропс для регистрации: если юзер успешно создал аккаунт, карточка сама переключит его на экран входа.
        )}
      </div>
    </div>
  );
};
