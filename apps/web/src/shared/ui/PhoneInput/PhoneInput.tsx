//Работа с IMask:
import { Controller, type Control, type FieldError } from "react-hook-form";
import { IMaskInput } from "react-imask";
//Иконки:
import { HiOutlinePhone } from "react-icons/hi";
//Стили:
import styles from "./PhoneInput.module.scss";

interface PhoneInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  error?: FieldError;
  id?: string;
  required?: boolean;
  className?: string;
  center?: boolean;
}

export const PhoneInput = ({
  control,
  error,
  id = "phone-input",
  required = false,
  className = "",
  center,
}: PhoneInputProps) => {
  return (
    <div className={`${styles.row} ${className}`.trim()}>
      <div className={styles.label}>
        <label htmlFor={id}>
          <HiOutlinePhone />&nbsp;&nbsp;&nbsp;Телефон{" "}
          {required && <span className={styles.requiredStar}>*</span>}
        </label>
      </div>
      <div className={styles.value}>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <IMaskInput
              id={id}
              mask="+{7} (000) 000-00-00"
              value={value || ""}
              onAccept={(val) => onChange(val)}
              className={`${styles.maskInput} ${center ? styles.centered : ''} ${error ? styles.inputError : ''}`}
            />
          )}
        />
        {error && <span className={styles.errorText}>{error.message}</span>}
      </div>
    </div>
  );
};