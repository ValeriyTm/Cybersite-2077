import styles from "./ConfirmModal.module.scss";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;

}

export const ConfirmModal = ({
  isOpen,
  title,
  onConfirm,
  onCancel,
  isLoading,

}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Отмена
          </button>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
};
