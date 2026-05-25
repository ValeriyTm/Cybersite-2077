import type { SelectHTMLAttributes, ReactNode } from "react";
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
	registration: UseFormRegisterReturn; //Привязка к react-hook-form 
	error?: FieldError; //Объект ошибки из formState.errors 
	options: SelectOption[]; //Массив опций для отображения
	placeholder?: string; //Текст первой пустой опции (дефолтный выбор)
	visuallyHidden?: boolean;
	id?: string;
	center?: boolean;
}

export const Select = ({
	label,
	registration,
	error,
	options,
	placeholder = "Выберите значение",
	className,
	visuallyHidden,
	id,
	center,
	...props
}: SelectProps) => {
	//Автоматический ID на основе имени в react-hook-form:
	const selectId = id || registration?.name;

	return (
		<div className={styles.field}>
			<label
				htmlFor={selectId}
				className={`${styles.label} ${visuallyHidden ? "visually-hidden" : ""}`}
			>
				{label}
			</label>

			<select
				id={selectId}
				{...registration}
				{...props}
				className={`${styles.select} ${center ? styles.center : ''} ${error ? styles.inputError : ""} ${className || ""}`}
			>
				{/* Дефолтная пустая опция-плейсхолдер */}
				<option value="">{placeholder}</option>

				{/* Рендеринг переданных опций */}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>

			{/* Вывод ошибки, если она есть: */}
			{error && <span className={styles.errorText}>{error.message}</span>}
		</div>
	);
};
