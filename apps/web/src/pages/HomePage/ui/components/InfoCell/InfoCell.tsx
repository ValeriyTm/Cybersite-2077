import styles from "./InfoCell.module.scss";

interface InfoCellProps {
  imageSrc: string;
  altText: string;
  title: string;
  description: string;
}

export const InfoCell = ({ imageSrc, altText, title, description }: InfoCellProps) => {
  return (
    <div className={styles.infoCell}>
      <div className={styles.innerContainer}>
        <div className={styles.subContainer}>
          <img
            src={imageSrc}
            alt={altText}
            loading="lazy"
            className={styles.innerImage}
            width="308"
            height="308"
          />
        </div>
        <div className={styles.subContainer}>
          <p className={styles.textMain}>{title}</p>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
};
