import { Link } from "react-router";
import { useAuth } from "@/features/auth/model/auth-store";

export const HomePage = () => {
  const isAuth = useAuth((state) => state.isAuth);
  const user = useAuth((state) => state.user);

  return (
    <div
      style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}
    >
      <h1>Welcome to Cybersite 🚀</h1>
      {isAuth ? (
        <div>
          <p>
            Привет, <b>{user?.name}</b>!
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
