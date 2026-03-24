import { type InputHTMLAttributes, type ReactNode } from "react";
import { type UseFormRegisterReturn, type FieldError } from "react-hook-form";
import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  registration: UseFormRegisterReturn; // Привязка к react-hook-form
  error?: FieldError; // Объект ошибки из formState.errors
}

export const Input = ({
  label,
  registration,
  error,
  className,
  ...props
}: InputProps) => {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        {...registration}
        {...props}
        className={`${styles.input} ${error ? styles.inputError : ""} ${className || ""}`}
      />
      {error && <span className={styles.errorText}>{error.message}</span>}
    </div>
  );
};
