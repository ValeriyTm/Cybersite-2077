import { type TextareaHTMLAttributes, type ReactNode, useId } from "react";
import { type UseFormRegisterReturn, type FieldError } from "react-hook-form";
//Стили:
import styles from "./Textarea.module.scss"; // Создайте этот файл или используйте общие стили для полей

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: ReactNode;
	registration?: UseFormRegisterReturn; // Привязка к react-hook-form
	error?: FieldError; // Объект ошибки из formState.errors
	visuallyHidden?: boolean;
	id?: string;
	showCharCount?: boolean; //Показывать ли счетчик символов
}

export const Textarea = ({
	label,
	registration,
	error,
	className,
	visuallyHidden,
	id,
	maxLength,
	showCharCount = false,
	value,
	onChange,
	...props
}: TextareaProps) => {
	const generatedId = useId();

	const textareaId = id || registration?.name || generatedId;

	//Текущая длина текста:
	const currentLength = String(value || "").length;

	//Warning, если осталось меньше 5% свободного места:
	const isWarning = maxLength ? currentLength >= maxLength * 0.95 : false;

	return (
		<div className={styles.field}>
			<label
				htmlFor={textareaId}
				className={`${styles.label} ${visuallyHidden ? "visually-hidden" : ""}`}
			>
				{label}
			</label>
			<div className={styles.textareaWrapper}>
				<textarea
					id={textareaId}
					{...registration}
					maxLength={maxLength}
					value={value}
					onChange={onChange}
					{...props}
					className={`${styles.textarea} ${error ? styles.inputError : ""} ${className || ""}`}
				/>
				{/* Счетчик символов: */}
				{showCharCount && maxLength && (
					<span className={`${styles.charCount} ${isWarning ? styles.warning : ""}`}>
						{currentLength} / {maxLength}
					</span>
				)}
			</div>
			{error && <span className={styles.errorText}>{error.message}</span>}
		</div>
	);
};
