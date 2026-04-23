import { type InputHTMLAttributes, type ReactNode } from "react";
import { type UseFormRegisterReturn, type FieldError } from "react-hook-form";
//Стили:
import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  registration: UseFormRegisterReturn; // Привязка к react-hook-form
  error?: FieldError; // Объект ошибки из formState.errors
  visuallyHidden?: boolean;
  id?: string;
}

export const Input = ({
  label,
  registration,
  error,
  className,
  visuallyHidden,
  id,
  ...props
}: InputProps) => {
  //Если id не передан, то используем имя из registration:
  const inputId = id || registration?.name;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={`${styles.label} ${visuallyHidden ? 'visually-hidden' : ''}`}>{label}</label>
      <input
        id={inputId}
        {...registration}
        {...props}
        className={`${styles.input} ${error ? styles.inputError : ""} ${className || ""}`}
      />
      {error && <span className={styles.errorText}>{error.message}</span>}
    </div>
  );
};
