import { Controller, type Control, type FieldError } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { HiOutlinePhone } from "react-icons/hi";
import styles from "../../ProfilePage.module.scss";

interface PhoneInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  error?: FieldError;
}

export const PhoneInput = ({ control, error }: PhoneInputProps) => {
  return (
    <div className={styles.row}>
      <div className={styles.label}>
        <label htmlFor="phone-input">
          <HiOutlinePhone />&nbsp;&nbsp;&nbsp;Телефон{" "}
          <span className={styles.requiredStar}>*</span>
        </label>
      </div>
      <div className={styles.value}>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <IMaskInput
              id="phone-input"
              mask="+{7} (000) 000-00-00"
              value={value || ""}
              onAccept={(val) => onChange(val)}
              className={error ? styles.inputError : styles.maskInput}
            />
          )}
        />
        {error && <span className={styles.errorText}>{error.message}</span>}
      </div>
    </div>
  );
};
