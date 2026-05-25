import { type TextareaHTMLAttributes, type ReactNode } from "react";
import { type UseFormRegisterReturn, type FieldError } from "react-hook-form";
//Стили:
import styles from "./Textarea.module.scss"; // Создайте этот файл или используйте общие стили для полей

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: ReactNode;
	registration: UseFormRegisterReturn; // Привязка к react-hook-form
	error?: FieldError; // Объект ошибки из formState.errors
	visuallyHidden?: boolean;
	id?: string;
}

export const Textarea = ({
	label,
	registration,
	error,
	className,
	visuallyHidden,
	id,
	...props
}: TextareaProps) => {
	// Если id не передан, используем имя из registration
	const textareaId = id || registration?.name;

	return (
		<div className={styles.field}>
			<label
				htmlFor={textareaId}
				className={`${styles.label} ${visuallyHidden ? "visually-hidden" : ""}`}
			>
				{label}
			</label>
			<textarea
				id={textareaId}
				{...registration}
				{...props}
				className={`${styles.textarea} ${error ? styles.inputError : ""} ${className || ""}`}
			/>
			{error && <span className={styles.errorText}>{error.message}</span>}
		</div>
	);
};
