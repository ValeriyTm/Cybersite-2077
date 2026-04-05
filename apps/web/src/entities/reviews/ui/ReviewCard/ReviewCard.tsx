import { useState } from "react";
import styles from "./ReviewCard.module.scss";

export const ReviewCard = ({
  review,
  onDelete,
  currentUserId,
  isAdmin,
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = review.comment.length > 200;

  // Текст для отображения
  const displayText =
    isExpanded || !isLongText
      ? review.comment
      : `${review.comment.slice(0, 200)}...`;

  const canDelete = review.userId === currentUserId || isAdmin;

  console.log("review avatar: ", review.userAvatar);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.user}>
          <img
            src={
              review.userAvatar
                ? `http://localhost:3001${review.userAvatar}`
                : "http://localhost:3001/static/defaults/default-avatar.png"
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
              src={`http://localhost:3001/static/..${img}`}
              alt="review-pic"
            />
          ))}
        </div>
      </div>

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
