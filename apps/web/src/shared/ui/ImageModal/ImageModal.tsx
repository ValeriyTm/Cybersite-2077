import ReactDOM from "react-dom";
import styles from "./ImageModal.module.scss";

interface ImageModalProps {
  src: string;
  onClose: () => void;
}

export const ImageModal = ({ src, onClose }: ImageModalProps) => {
  //Используем Portal, чтобы модалка была в корне DOM и не обрезалась контейнерами
  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container}>
        <img src={src} alt="fullsize" onClick={(e) => e.stopPropagation()} />
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>
    </div>,
    document.body,
  );
};
