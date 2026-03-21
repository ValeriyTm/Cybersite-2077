import { Link } from "react-router";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useProfile } from "@/features/auth/model/use-profile";

export const HomePage = () => {
  // 1. Из Zustand берем только статус (для быстрой проверки)
  const isAuth = useAuthStore((state) => state.isAuth);

  // 2. Из React Query берем данные пользователя
  // Мы используем isLoading, чтобы не показывать "Вы не авторизованы", пока идет запрос
  const { user, isLoading } = useProfile();

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>Загрузка...</div>
    );

  return (
    <div
      style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}
    >
      <h1>Welcome to Cybersite 🚀</h1>

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
    </div>
  );
};
