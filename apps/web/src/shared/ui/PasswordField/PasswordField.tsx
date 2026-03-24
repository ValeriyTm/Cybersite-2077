import { useState } from "react";
import { type UseFormRegisterReturn, type FieldError } from "react-hook-form";
import { HiEye, HiEyeOff } from "react-icons/hi";
import styles from "./PasswordField.module.scss";

interface PasswordFieldProps {
  label: string; //Метка для инпута
  placeholder?: string; //Placeholder для инпута
  registration: UseFormRegisterReturn; // Результат функции register() (привязка к форме).
  error?: FieldError; //Откуда ошибки брать
  showToggle?: boolean; // Нужно ли показывать глаз
}

export const PasswordField = ({
  label,
  placeholder = "••••••••",
  registration,
  error,
  showToggle = true,
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            {...registration}
            placeholder={placeholder}
            className={error ? styles.inputError : ""}
          />
          {showToggle && (
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error.message}</span>}
      </div>
    </div>
  );
};
