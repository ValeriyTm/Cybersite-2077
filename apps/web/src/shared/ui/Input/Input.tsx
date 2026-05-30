import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import type { UseFormRegisterReturn, FieldError, FieldErrorsImpl, Merge } from "react-hook-form";
//Стили:
import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  registration?: UseFormRegisterReturn; // Привязка к react-hook-form
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<Record<string, unknown>>>;  // Объект ошибки из formState.errors
  visuallyHidden?: boolean;
  id?: string;
  center?: boolean;
  variant?: 'dark' | 'light' | 'dark-full';
}

export const Input = ({
  label,
  registration,
  error,
  className,
  visuallyHidden,
  id,
  center,
  variant = 'light',
  ...props
}: InputProps) => {
  const generatedId = useId();

  const inputId = id || registration?.name || generatedId;
  const errorMessage = error && 'message' in error ? String(error.message) : undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={`${styles.label} ${visuallyHidden ? 'visually-hidden' : ''}`}>{label}</label>
      <input
        id={inputId}
        {...registration}
        {...props}
        className={`${styles.input} ${center ? styles.centered : ''} ${styles[variant]} ${error ? styles.inputError : ""} ${className || ""}`}
      />
      {errorMessage && <span className={styles.errorText}>{String(errorMessage)}</span>}
    </div>
  );
};
