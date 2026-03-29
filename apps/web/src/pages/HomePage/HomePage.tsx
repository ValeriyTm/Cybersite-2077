//Роутер:
import { Link } from "react-router";
//Хранилища:
import { useAuthStore } from "@/features/auth/model/auth-store"; //Клиентское
import { useProfile } from "@/features/auth/model/use-profile"; //Серверное

export const HomePage = () => {
  //Из Zustand берем статус авторизации пользователя:
  const isAuth = useAuthStore((state) => state.isAuth);

  //Из React Query берем данные пользователя и состояние загрузки.
  //Используется isLoading, чтобы не показывать "Вы не авторизованы", пока идет запрос.
  const { user, isLoading } = useProfile();

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>Загрузка...</div>
    );

  return (
    <div
      style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}
    >
      <h1>Welcome to Cybersite ░☣️▒▒▓▓</h1>

      {isAuth && user ? (
        <div>
          <p>
            Привет, <b>{user.name}</b>!
          </p>
          <Link to="/profile" style={{ marginRight: "10px" }}>
            В профиль
          </Link>
        </div>
      ) : (
        <div>
          <p>Вы не авторизованы</p>
          <Link to="/auth">Войти / Зарегистрироваться</Link>
        </div>
      )}
      <Link to="/catalog" style={{ marginRight: "10px" }}>
        В каталог
      </Link>
    </div>
  );
};
