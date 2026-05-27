//Состояние:
import { useAuthStore, useProfile } from "../../model";
import { useProfileActions } from "../../lib";
//Навигация:
import { Link } from "react-router";
//Компоненты:
import { Avatar } from "@/shared/ui";
//Стили:
import styles from "./HeaderUserButton.module.scss";

export const HeaderUserButton = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const { user, isLoading } = useProfile();
  const { avatarSrc } = useProfileActions(user);

  return (
    <div className={styles.userActions}>
      <Link to={isAuth ? "/profile" : "/auth"} className={styles.profileLink}>
        <Avatar
          src={isAuth ? avatarSrc : null}
          alt={user?.name || "Гость"}
          size="sm"
          isAvatarLoading={isLoading}
        />
        <div className={styles.userInfo} title={user?.name || ""}>
          <span className={styles.userName}>
            {isAuth && user && !isLoading ? user.name : "Войти"}
          </span>
        </div>
      </Link>
    </div>
  );
};
