import { useId, type Dispatch, type SetStateAction } from "react";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from "./ReviewPhotoSection.module.scss";

interface ReviewPhotoSectionProps {
  images: File[];
  setImages: Dispatch<SetStateAction<File[]>>;
  previews: string[];
  setPreviews: Dispatch<SetStateAction<string[]>>;
}

export const ReviewPhotoSection = ({
  images,
  setImages,
  previews,
  setPreviews,
}: ReviewPhotoSectionProps) => {
  const fileInputId = useId(); //Генерация уникального ID

  // Обработка выбора фото
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 5) {
      toast.error("Максимум можно загрузить 5 фотографий");
      return;
    }

    setImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Удаление конкретного фото из загружаемых
  const removePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const inputEl = document.getElementById(fileInputId) as HTMLInputElement;
      inputEl?.click();
    }
  };

  return (
    <div className={styles.photoSection}>
      <label
        className={styles.uploadLabel}
        tabIndex={0}
        role="button"
        aria-label="Добавить фотографии к отзыву, максимум 5 штук"
        onKeyDown={handleKeyDown}
      >
        <span>📷 Добавить фото (до 5 шт)</span>
        <input
          id={fileInputId}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
      </label>

      {/* Список превью загруженных картинок */}
      {previews.length > 0 && (
        <div className={styles.previews}>
          {previews.map((src, i) => (
            <div key={i} className={styles.previewItem}>
              <img
                src={src}
                alt="Превью загруженного изображения для отзыва"
                width="70"
                height="70"
              />
              <button
                type="button"
                className={styles.removeIcon}
                onClick={() => removePhoto(i)}
                aria-label="Удалить это фото"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
