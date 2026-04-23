import React from "react";
import styles from "./RatingInput.module.scss";

interface RatingInputProps {
  value: number;
  onChange: (val: number) => void;
  name: string;
}

export const RatingInput = ({ value, onChange, name = "rating" }: RatingInputProps) => {
  return (
    <div className={styles.ratingGroup}>
      {[5, 4, 3, 2, 1].map((star) => ( // Массив часто разворачивают для удобства CSS-селекторов
        <React.Fragment key={star}>
          <input
            type="radio"
            id={`star-${star}`}
            name={name}
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            className={styles.radioInput}
          />
          <label htmlFor={`star-${star}`} className={styles.starLabel} title={`Оценка ${star}`}>
            ★
          </label>
        </React.Fragment>
      ))}
    </div>
  );
};

