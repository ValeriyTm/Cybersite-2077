import { useRef } from "react";
import { useAuth } from "@/features/auth/model/auth-store";
import { $api, API_URL } from "@/shared/api/api";
import { toast } from "react-hot-toast";
import styles from "./ProfilePage.module.scss";

export const ProfilePage = () => {
  const { user, setAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    // При клике на фото открываем скрытый инпут выбора файла
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Создаем FormData для отправки файла (как мы делали в Postman)
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await $api.post("/identity/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Обновляем данные пользователя в сторе (чтобы картинка сразу сменилась)
      if (user) {
        setAuth(
          { ...user, avatarUrl: response.data.avatarUrl },
          localStorage.getItem("auth-storage")
            ? JSON.parse(localStorage.getItem("auth-storage")!).state
                .accessToken
            : "",
        );
      }

      toast.success("Аватар успешно обновлен!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка загрузки");
    }
  };

  const avatarSrc = user?.avatarUrl
    ? `${API_URL}${user.avatarUrl}`
    : "/default-avatar.png";

  return (
    <div className={styles.container}>
      <h1>Личный кабинет</h1>

      <div className={styles.avatarSection}>
        <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
          <img src={avatarSrc} alt="Avatar" className={styles.avatarImage} />
          <div className={styles.overlay}>Сменить фото</div>
        </div>
        {/* Скрытый инпут */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.infoCard}>
        <p>
          <strong>Имя:</strong> {user?.name}
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
      </div>
    </div>
  );
};
