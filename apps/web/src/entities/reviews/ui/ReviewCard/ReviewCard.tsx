//Состояния:
import { useState } from "react";
//API:
import { API_URL } from "@/shared/api";
//Компоненты:
import { Button, ImageModal } from "@/shared/ui";
//Типы:
import type { MotorcycleReview } from "@/entities/catalog";
//Изображения:
import defaultAvatar from '@/shared/assets/images/defaults/default-avatar.png'
//Стили:
import styles from "./ReviewCard.module.scss";

interface ReviewCardProps {
  review: MotorcycleReview;
  onDelete: (data: string) => void;
  currentUserId?: string;
  isAdmin: boolean;
}

export const ReviewCard = ({
  review,
  onDelete,
  currentUserId,
  isAdmin,
}: ReviewCardProps) => {
  //"Раскрыт" текст комментария или нет:
  const [isExpanded, setIsExpanded] = useState(false);
  //Состояние для открытия прикрепленного фото в модалке:
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  //Длинный ли текст комментария:
  const isLongText = review.comment.length > 200;

  //Текст для отображения (обрезаем до 200 символов или показываем весь длинный коммент):
  const displayText =
    isExpanded || !isLongText
      ? review.comment
      : `${review.comment.slice(0, 200)}...`;

  //Может ли юзер удалить отзыв:
  const canDelete = review.userId === currentUserId || isAdmin;

  //Парсинг даты:
  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString()
    : "Дата не указана";

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.user}>
          <img decoding="async"
            src={
              review.userAvatar
                ? `${API_URL}${review.userAvatar}`
                : defaultAvatar
            }
            alt="avatar"
            width='40'
            height='40'
            className={styles.avatar}
          />
          <span className={styles.name}>{review.userName}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.date}>
            {formattedDate}
          </span>
          <div className={styles.rating}>
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.text}>{displayText}</p>
        {isLongText && (
          <button
            className={styles.toggleText}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Скрыть" : "Читать полностью"}
          </button>
        )}

        <div className={styles.images}>
          {review.images.map((img: string, i: number) => (
            <img
              key={i}
              src={`${API_URL}${img}`}
              alt="review picture"
              onClick={() => setPhotoIndex(i)} //Открываем галерею при клике
            />
          ))}
        </div>
      </div>

      {canDelete && (
        <div className={styles.btnWrapper}>
          <Button
            type="button"
            variant="cancel"
            onClick={() => onDelete(review._id)}
          >
            Удалить отзыв
          </Button>
        </div>
      )}

      {/*Компонент галереи: */}
      {photoIndex !== null && (
        <ImageModal
          images={review.images.map((img: string) => `${API_URL}${img}`)}
          startIndex={photoIndex}
          onClose={() => setPhotoIndex(null)}
        />
      )}
    </article>
  );
};
