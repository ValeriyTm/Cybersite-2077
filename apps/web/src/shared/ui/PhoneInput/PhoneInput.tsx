//Работа с IMask:
import { Controller, type Control, type FieldError, type FieldValues, type Path } from "react-hook-form";
import { IMaskInput } from "react-imask";
//Иконки:
import { HiOutlinePhone } from "react-icons/hi";
//Стили:
import styles from "./PhoneInput.module.scss";

interface PhoneInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  error?: FieldError;
  id?: string;
  required?: boolean;
  className?: string;
  center?: boolean;
  variant?: "support" | 'profile';
  disabled?: boolean;
}

export const PhoneInput = <TFieldValues extends FieldValues>({
  control,
  name,
  error,
  id = "phone-input",
  required = false,
  className = "",
  center,
  variant = 'support',
  disabled = false,
}: PhoneInputProps<TFieldValues>) => {
  return (
    <div className={`${styles.row} ${className} ${styles[variant]}`.trim()}>
      <div className={styles.label}>
        <label htmlFor={id}>
          <HiOutlinePhone />&nbsp;&nbsp;&nbsp;Телефон{" "}
          {required && <span className={styles.requiredStar}>*</span>}
        </label>
      </div>
      <div className={styles.value}>
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, value } }) => (
            <IMaskInput
              id={id}
              mask="+{7} (000) 000-00-00"
              value={value || ""}
              onAccept={(val) => onChange(val)}
              disabled={disabled}
              className={`${styles.maskInput} ${center ? styles.centered : ''} ${error ? styles.inputError : ''}`}
            />
          )}
        />
        {error && <span className={styles.errorText}>{error.message}</span>}
      </div>
    </div>
  );
};