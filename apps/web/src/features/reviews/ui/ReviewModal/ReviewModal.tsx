//Состояния:
import { useEffect, useState } from "react";
import { useCreateReview } from "@/features/reviews";
//Компоненты:
import { Button, RatingInput, Textarea } from "@/shared/ui";
import { ReviewPhotoSection } from "@/features/reviews";
//Работа с фокусом:
import { FocusTrap } from 'focus-trap-react';
//Порталы для модалки:
import { createPortal } from "react-dom";
//Типы:
import type { OrderItem } from "@/entities/ordering/types/types";
//Уведомления:
import toast from "react-hot-toast";
//Стил:
import styles from "./ReviewModal.module.scss";


export const ReviewModal = ({
  orderId,
  item,
  onClose,
  isReviewModalOpen,
}: {
  orderId: string;
  item: OrderItem;
  onClose: () => void;
  isReviewModalOpen: boolean;
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const createReviewMutation = useCreateReview(onClose);

  //Блокировка скроллбара:
  useEffect(() => {
    if (!isReviewModalOpen) return;
    //Сохраняем исходный стиль скролла, чтобы случайно не затереть другие глобальные стили
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isReviewModalOpen, previews]);

  //Обработчик оптправки ревью:
  const handleSubmit = () => {
    if (comment.length < 5) {
      return toast.error("Слишком короткий отзыв (минимум 5 символов)");
    }

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("motorcycleId", item.motorcycleId);
    formData.append("rating", rating.toString());
    formData.append("comment", comment);
    images.forEach((file) => formData.append("images", file));

    createReviewMutation.mutate(formData);
  };

  if (!isReviewModalOpen) return null;

  return createPortal(
    <FocusTrap active={isReviewModalOpen} focusTrapOptions={{ onDeactivate: onClose }}>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h3>Оставить отзыв на {item.motorcycle.model}</h3>

          <div className={styles.section}>
            <label>Ваша оценка:</label>
            <RatingInput value={rating} onChange={setRating} />
          </div>

          <Textarea
            id="review-text"
            placeholder="Напишите ваш отзыв..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            showCharCount={true} // Передали флаг счетчика
            label="Текст отзыва"
            visuallyHidden
          />

          <ReviewPhotoSection
            images={images}
            setImages={setImages}
            previews={previews}
            setPreviews={setPreviews}
          />

          <div className={styles.actions}>
            <Button type="button" variant="outline-dark" onClick={onClose} className={styles.btnAction}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={createReviewMutation.isPending}
              isLoading={createReviewMutation.isPending}
              loadingText="Отправка..."
              className={styles.btnAction}
            >
              Опубликовать
            </Button>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.getElementById('modals-root')!
  );
};
