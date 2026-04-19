import { HiUser } from "react-icons/hi";
import styles from "./Avatar.module.scss";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  isAvatarLoading?: boolean;
  isEditing?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg"; // Добавим гибкости для будущего
}

export const Avatar = ({
  src,
  alt = "Аватар пользователя",
  isAvatarLoading = false,
  isEditing = false,
  onClick,
  size = "md",
}: AvatarProps) => {
  return (
    <div
      className={`${styles.avatarWrapper} ${styles[size]} ${isAvatarLoading ? styles.loading : ""}`}
      onClick={onClick}
    >
      {/* Сама картинка */}
      <img
        src={src || "images/default-avatar.png"}
        alt={alt}
        decoding="async"
        referrerPolicy="no-referrer"
        style={{ opacity: isAvatarLoading ? 0.5 : 1 }}
      />

      {/* Спиннер при загрузке */}
      {isAvatarLoading && (
        <div className={styles.spinnerOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Оверлей редактирования */}
      {isEditing && !isAvatarLoading && (
        <div className={styles.avatarOverlay}>Сменить</div>
      )}
    </div>
  );
};
