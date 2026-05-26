import { type SelectHTMLAttributes, type ReactNode, useId } from "react";
import type { UseFormRegisterReturn, FieldError } from "react-hook-form";
//Стили:
import styles from "./Select.module.scss";

// Структура для каждой опции в выпадающем списке
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  registration?: UseFormRegisterReturn; //Привязка к react-hook-form 
  error?: FieldError; //Объект ошибки из formState.errors 
  options: SelectOption[]; //Массив опций для отображения
  placeholder?: string; //Текст первой пустой опции (дефолтный выбор)
  showPlaceholder?: boolean; //Показывать ли пустую опцию
  visuallyHidden?: boolean;
  id?: string;
  center?: boolean;
  variant?: 'light' | 'dark';
  direction?: 'row' | 'column';
}

export const Select = ({
  label,
  registration,
  error,
  options,
  placeholder = "Выберите значение",
  showPlaceholder = false,
  className,
  visuallyHidden,
  id,
  center,
  variant = 'light',
  direction = 'column',
  ...props
}: SelectProps) => {
  const generatedId = useId();
  //Автоматический ID на основе имени в react-hook-form:
  const selectId = id || registration?.name || generatedId;

  return (
    <div className={`${direction == 'column' ? styles.parentWrapperColumn : styles.parentWrapperRow}`}>
      <label
        htmlFor={selectId}
        className={`${styles.label} ${variant == 'dark' ? styles.labelDark : styles.labelLight} ${visuallyHidden ? "visually-hidden" : ""}`}
      >
        {label}
      </label>

      <div className={styles.selectWrapper}>
        <select
          id={selectId}
          {...registration}
          {...props}
          className={`$${styles.select} ${center ? styles.center : ''} ${variant == 'dark' ? styles.dark : styles.light} ${error ? styles.inputError : ""} ${className || ""}`}
        >
          {/* Рендерим плейсхолдер только если передан флаг showPlaceholder: */}
          {showPlaceholder && <option value="">{placeholder}</option>}

          {/* Рендеринг переданных опций */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Элемент кастомной стрелочки */}
        <span className={styles.arrow} aria-hidden="true" />
      </div>

      {/* Вывод ошибки, если она есть: */}
      {error && <span className={styles.errorText}>{error.message}</span>}
    </div>
  );
};
