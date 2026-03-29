import styles from "./SpecRow.module.scss";

export const SpecRow = ({ label, value }) => {
  const isEmpty = !value; // Проверяем, есть ли данные

  return (
    <div className={styles.specRow}>
      <span>{label}:</span>{" "}
      <strong className={isEmpty ? styles.noData : ""}>
        {value || "Нет данных"}
      </strong>
    </div>
  );
};
