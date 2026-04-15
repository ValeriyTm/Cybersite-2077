//Состояния:
import { useState } from "react";
//API:
import { API_URL } from "@/shared/api/api";
//Компоненты:
import { ImageModal } from "@/shared/ui/ImageModal/ImageModal";
//Стили:
import styles from "./ReviewCard.module.scss";


export const ReviewCard = ({
  review,
  onDelete,
  currentUserId,
  isAdmin,
}: any) => {
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

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.user}>
          <img
            src={
              review.userAvatar
                ? `${API_URL}${review.userAvatar}`
                : `${API_URL}/static/defaults/default-avatar.png`
            }
            alt="avatar"
            className={styles.avatar}
          />
          <span className={styles.name}>{review.userName}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.date}>
            {new Date(review.createdAt).toLocaleDateString()}
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
              alt="review-pic"
              onClick={() => setPhotoIndex(i)} //Открываем галерею при клике
              className={styles.clickableImg}
            />
          ))}
        </div>
      </div>

      {/*Компонент галереи: */}
      {photoIndex !== null && (
        <ImageModal
          images={review.images.map((img) => `${API_URL}${img}`)}
          startIndex={photoIndex}
          onClose={() => setPhotoIndex(null)}
        />
      )}

      {canDelete && (
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(review._id)}
        >
          Удалить отзыв
        </button>
      )}
    </div>
  );
};
