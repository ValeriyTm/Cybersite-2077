import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
//Стили:
import styles from "./ActionConfirmModal.module.scss";


interface ActionConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  variant?: "danger" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  role?: string;
}

export const ActionConfirmModal = ({
  isOpen,
  title,
  description,
  variant = "info",
  confirmText = "Да",
  cancelText = "Назад",
  isSubmitting = false,
  onConfirm,
  onCancel,
  role
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

  const isRestricted = role == "WATCHER";

  if (!isOpen) return null;

  // Динамически подбираем классы стилей в зависимости от варианта
  const contentClassName = `${styles.modalContent} ${styles[variant]}`;
  const titleClassName = `${styles.modalTitle} ${styles['title-' + variant]}`;
  const confirmBtnClassName = `${styles.btnConfirm} ${styles['btn-' + variant]}`;

  return createPortal(
    <div className={styles.modalOverlay} onClick={isSubmitting ? undefined : onCancel}>
      <FocusTrap focusTrapOptions={{ escapeDeactivates: !isSubmitting, onDeactivate: onCancel }}>
        <div className={contentClassName} onClick={(e) => e.stopPropagation()}>
          <h3 className={titleClassName}>{title}</h3>
          <p className={styles.modalText}>{description}</p>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onCancel} disabled={isSubmitting}>
              {cancelText}
            </button>

            <button type="button" className={confirmBtnClassName} onClick={onConfirm} disabled={isSubmitting || isRestricted}>
              {isSubmitting ? "Ждите..." : confirmText}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>,
    document.getElementById("modals-root")!
  );
};
