//Состояние:
import { useAuthStore } from "@/features/auth/model/useAuthStore";
//Роутинг:
import { Navigate } from "react-router";

//Публичный маршрут:
export const GuestRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuth = useAuthStore((state) => state.isAuth);
    //Если юзер залогинен, то не пускаем его на форму логина, а отправляем в профиль:
    return isAuth ? <Navigate to="/profile" replace /> : children;
};

