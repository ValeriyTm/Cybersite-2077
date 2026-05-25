import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
//Стили:
import styles from "./Checkbox.module.scss";

interface CheckboxProps extends ComponentPropsWithoutRef<"input"> {
  label: ReactNode; // Используем ReactNode, чтобы внутри лейбла можно было передавать ссылки <a>
  registration: UseFormRegisterReturn;
  error?: { message?: string };
}

export const Checkbox = ({ label, registration, error, ...props }: CheckboxProps) => {
  const generatedId = useId();
  const id = props.id || generatedId;

  return (
    <div className={styles.checkboxWrapper}>
      <label htmlFor={id} className={styles.checkboxLabel}>
        <input
          type="checkbox"
          id={id}
          className={error ? styles.inputError : ""}
          {...registration}
          {...props}
        />
        <span className={styles.labelText}>{label}</span>
      </label>

      {error?.message && (
        <span className={styles.errorText}>{error.message}</span>
      )}
    </div>
  );
};
