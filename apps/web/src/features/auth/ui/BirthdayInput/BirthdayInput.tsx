//Работа с IMask:
import { Controller, type Control, type FieldError } from "react-hook-form";
import { IMaskInput } from "react-imask";
import IMask from "imask";
//Иконки:
import { HiOutlineCalendar } from "react-icons/hi";
//Стили:
import styles from "./BirthdayInput.module.scss";

interface BirthdayInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  error?: FieldError;
}

export const BirthdayInput = ({ control, error }: BirthdayInputProps) => {
  return (
    <div className={styles.row}>
      <div className={styles.label}>
        <label htmlFor="birthday-input">
          <HiOutlineCalendar />&nbsp;&nbsp;&nbsp;День рождения&nbsp;
          <span className={styles.requiredStar}>*</span>
        </label>
      </div>
      <div className={styles.value}>
        <Controller
          control={control}
          name="birthday"
          render={({ field: { onChange, value } }) => (
            <IMaskInput
              id="birthday-input"
              placeholder="ДД.ММ.ГГГГ"
              mask={Date}
              pattern="DD.MM.YYYY"
              blocks={{
                DD: { mask: IMask.MaskedRange, from: 1, to: 31 },
                MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
                YYYY: { mask: IMask.MaskedRange, from: 1900, to: new Date().getFullYear() },
              }}
              format={(date: Date | null) => (date ? date.toLocaleDateString("ru-RU") : "")}
              parse={(str: string) => {
                const [d, m, y] = str.split(".");
                return new Date(Number(y), Number(m) - 1, Number(d));
              }}
              value={value instanceof Date ? value.toLocaleDateString("ru-RU") : ""}
              onAccept={(_, mask) => onChange(mask.typedValue)}
              className={error ? styles.inputError : styles.maskInput}
            />
          )}
        />
        {error && <span className={styles.errorText}>{error.message}</span>}
      </div>
    </div>
  );
};
