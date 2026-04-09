import styles from "./ReviewCard.module.scss";

interface ReviewProps {
  name: string;
  avatarUrl: string;
  rating: number;
  text: string;
}

const ReviewCard = ({ name, avatarUrl, rating, text }: ReviewProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img src={avatarUrl} alt={name} className={styles.avatar} />
        <div>
          <h4 className={styles.name}>{name}</h4>
          <div className={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={i < rating ? styles.starActive : styles.starEmpty}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className={styles.text}>{text}</p>
    </div>
  );
};

export default ReviewCard;
