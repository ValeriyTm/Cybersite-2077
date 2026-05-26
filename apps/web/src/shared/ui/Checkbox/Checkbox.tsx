import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
//Стили:
import styles from "./Checkbox.module.scss";

interface CheckboxProps extends ComponentPropsWithoutRef<"input"> {
  label: ReactNode; // Используем ReactNode, чтобы внутри лейбла можно было передавать ссылки <a>
  registration?: UseFormRegisterReturn;
  error?: { message?: string };
  smallText?: boolean;
  single?: boolean;
  wither?: boolean;
}

export const Checkbox = ({ label, registration, error, single = false, smallText = false, wither = false, ...props }: CheckboxProps) => {
  const generatedId = useId();
  const id = props.id || generatedId;

  if (single) {
    return (
      <>
        <label htmlFor={id} className='visually-hidden'>{label}</label>
        <input
          type="checkbox"
          id={id}
          className={styles.single}
          {...props}
        />
      </>
    )
  }

  return (
    <div className={styles.checkboxWrapper}>
      <label htmlFor={id} className={`${styles.checkboxLabel} ${smallText ? styles.smallText : ''} `}>
        <input
          type="checkbox"
          id={id}
          className={error ? styles.inputError : ""}
          {...registration}
          {...props}
        />
        <span className={wither ? styles.labelTextWither : styles.labelText}>{label}</span>
      </label>

      {error?.message && (
        <span className={styles.errorText}>{error.message}</span>
      )}
    </div>
  );
};
