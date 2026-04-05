import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { RatingInput } from "@/shared/ui/RatingInput/RatingInput";
import toast from "react-hot-toast";
import styles from "./ReviewModal.module.scss";

export const ReviewModal = ({
  orderId,
  item,
  onClose,
}: {
  orderId: string;
  item: any;
  onClose: () => void;
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const queryClient = useQueryClient();

  //Обработка выбора фото:
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert("Максимум 5 фотографий");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    //Создаем URL для превью:
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const mutation = useMutation({
    mutationFn: (formData: FormData) => $api.post("/reviews", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      // alert("Отзыв успешно отправлен!");
      toast.success("Отзыв успешно опубликован!");
      onClose();
    },
    onError: (error: any) => {
      //Берем сообщение, которое прислал бэкенд:
      const message = error.response?.data?.message || "Ошибка при отправке";
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    if (comment.length < 5) {
      return toast.error("Слишком короткий отзыв (минимум 5 символов)");
    }

    const formData = new FormData();

    //Используем пропсы напрямую:
    formData.append("orderId", orderId);
    formData.append("motorcycleId", item.motorcycleId);

    formData.append("rating", rating.toString());
    formData.append("comment", comment);

    images.forEach((file) => formData.append("images", file));

    mutation.mutate(formData);
  };

  //Удаление фото из загружаемых:
  const removePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      //Освобождаем память от URL.createObjectURL:
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Оставить отзыв на {item.motorcycle.model}</h3>

        <div className={styles.section}>
          <label>Ваша оценка:</label>
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <div className={styles.textareaWrapper}>
          <textarea
            maxLength={2000}
            placeholder="Напишите ваш отзыв..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <span className={styles.charCount}>{comment.length} / 2000</span>
        </div>

        <div className={styles.photoSection}>
          <label className={styles.uploadLabel}>
            <span>📷 Добавить фото (до 5 шт)</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </label>

          <div className={styles.previews}>
            {previews.map((src, i) => (
              <div key={i} className={styles.previewItem}>
                <img src={src} alt="preview" />
                <button
                  type="button"
                  className={styles.removeIcon}
                  onClick={() => removePhoto(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancel}>
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className={styles.submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Отправка..." : "Опубликовать"}
          </button>
        </div>
      </div>
    </div>
  );
};
