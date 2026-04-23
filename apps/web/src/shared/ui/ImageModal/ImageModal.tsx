import ReactDOM from "react-dom";
import { useState, useEffect, useCallback } from "react";
//Стили:
import styles from "./ImageModal.module.scss";

interface ImageModalProps {
  src: string;
  onClose: () => void;
}

export const ImageModal = ({
  images,
  startIndex,
  onClose,
}: ImageModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Функции переключения
  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  //Слушаем клавиатуру:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, onClose]);

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Кнопка Влево */}
        {images.length > 1 && (
          <button
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>
        )}

        <img src={images[currentIndex]} alt="fullsize review image" />

        {/* Кнопка Вправо */}
        {images.length > 1 && (
          <button
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            ›
          </button>
        )}

        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        {/* Индикатор: 1 / 5 */}
        <div className={styles.counter}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>,
    document.body,
  );
};
