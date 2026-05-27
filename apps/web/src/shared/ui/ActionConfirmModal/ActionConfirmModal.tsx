import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
//Стили:
import styles from "./ActionConfirmModal.module.scss";
import { useEffect } from "react";

interface ActionConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  variant?: "danger" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ActionConfirmModal = ({
  isOpen,
  title,
  description,
  variant = "info",
  confirmText = "Да",
  cancelText = "Назад",
  onConfirm,
  onCancel,
}: ActionConfirmModalProps) => {
  //Блокировка скроллбара:
  useEffect(() => {
    if (!isOpen) return;
    //Сохраняем исходный стиль скролла, чтобы случайно не затереть другие глобальные стили
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Динамически подбираем классы стилей в зависимости от варианта
  const contentClassName = `${styles.modalContent} ${styles[variant]}`;
  const titleClassName = `${styles.modalTitle} ${styles[`title-${variant}`]}`;
  const confirmBtnClassName = `${styles.btnConfirm} ${styles[`btn-${variant}`]}`;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onCancel}>
      <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: onCancel }}>
        <div className={contentClassName} onClick={(e) => e.stopPropagation()}>
          <h3 className={titleClassName}>{title}</h3>
          <p className={styles.modalText}>{description}</p>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onCancel}>
              {cancelText}
            </button>
            <button type="button" className={confirmBtnClassName} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>,
    document.getElementById("modals-root")!
  );
};
