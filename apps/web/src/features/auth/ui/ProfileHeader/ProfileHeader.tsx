import { useRef } from "react";
//Компоненты:
import { Avatar, Button } from "@/shared/ui";
//Стили:
import styles from "./ProfileHeader.module.scss";

interface ProfileHeaderProps {
  name: string;
  role?: string;
  avatarSrc: string;
  isAvatarLoading: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileHeader = ({
  name,
  role,
  avatarSrc,
  isAvatarLoading,
  isEditing,
  setIsEditing,
  onAvatarChange,
}: ProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (isEditing && !isAvatarLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={styles.profileHeader}>
      <Avatar
        src={avatarSrc}
        isAvatarLoading={isAvatarLoading}
        isEditing={isEditing}
        onClick={handleAvatarClick}
      />

      {/* Скрытый нативный инпут для загрузки файла */}
      <label htmlFor="avatar-file-input" className="visually-hidden">
        Загрузка аватара
      </label>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        id="avatar-file-input"
        onChange={onAvatarChange}
        accept="image/*"
      />

      <div className={styles.titleSection}>
        <h3>{name}</h3>
        <p>{role?.toLowerCase()}</p>
      </div>

      {!isEditing && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsEditing(true)}
        >
          Редактировать профиль
        </Button>
      )}
    </div>
  );
};
