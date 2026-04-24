import styles from "./SpecRow.module.scss";

interface SpecRowProps {
  label: string,
  value: string | undefined,
}

export const SpecRow = ({ label, value }: SpecRowProps) => {
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
