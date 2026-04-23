//Компоненты:
import { PasswordField } from "@/shared/ui/PasswordField";
import { Button } from "@/shared/ui/Button/Button";
//Типы:
import { type UseFormRegisterReturn, type FieldError } from "react-hook-form";
//Стили:
import styles from "./DeleteAccountModal.module.scss";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void; // Это будет handleSubmit(onDeleteAccount)
  registration: UseFormRegisterReturn;
  error?: FieldError;
  isLoading: boolean;
}

export const DeleteAccountModal = ({
  isOpen,
  onClose,
  onSubmit,
  registration,
  error,
  isLoading,
}: DeleteAccountModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 style={{ color: "#dc3545", marginBottom: "1rem" }}>
          Удаление аккаунта
        </h2>
        <p style={{ marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          Это действие **необратимо** ❗. <br />
          Введите пароль для подтверждения:
        </p>

        <form onSubmit={onSubmit}>
          <PasswordField
            label="Ваш текущий пароль"
            registration={registration}
            error={error}
          />

          <div className={styles.modalActions} style={{ marginTop: "1.5rem" }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isLoading}
              loadingText="Удаление..."
            >
              Удалить навсегда
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
