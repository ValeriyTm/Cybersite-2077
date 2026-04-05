import styles from "./RatingInput.module.scss";

interface RatingInputProps {
  value: number;
  onChange: (val: number) => void;
}

export const RatingInput = ({ value, onChange }: RatingInputProps) => {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= value ? styles.active : ""}
          onClick={() => onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};
