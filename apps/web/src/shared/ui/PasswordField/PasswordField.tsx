import { useState, type ReactNode } from "react";
import { type UseFormRegisterReturn, type FieldError } from "react-hook-form";
import { HiEye, HiEyeOff } from "react-icons/hi";
import styles from "./PasswordField.module.scss";

//Типы для пропсов:
interface PasswordFieldProps {
  label: ReactNode; //Метка для инпута
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
  //Состояние для отображать/не отображать символы пароля:
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        <div className={styles.passwordWrapper}>
          {/*Сам инпут:*/}
          <input
            type={showPassword ? "text" : "password"}
            {...registration}
            placeholder={placeholder}
            className={error ? styles.inputError : ""}
          />
          {/*Переключение "глаза":*/}
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
        {/*Вывод ошибок:*/}
        {error && <span className={styles.errorText}>{error.message}</span>}
      </div>
    </div>
  );
};
