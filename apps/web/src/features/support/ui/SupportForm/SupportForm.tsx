//Состояния:
import { useEffect, useState } from "react";
import { useProfile } from "@/features/auth";
//Валидация:
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicketFrontendSchema, type createTicketServiceArgs } from "@repo/validation";
//API:
import { $api } from "@/shared/api";
//Работа с формами:
import { useForm } from "react-hook-form";
//reCAPTCHA:
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
//Компоненты:
import { PhoneInput, Input, Textarea, Button, Select, FileUpload } from "@/shared/ui";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from "./SupportForm.module.scss";
import { REASON_OPTIONS } from "../../model/constants";

export const SupportForm = () => {
	const [files, setFiles] = useState<File[]>([]);
	const [isDragActive, setIsDragActive] = useState(false); //Стейт для отслеживания того, находится ли файл над областью загрузки:
	const { user } = useProfile(); //Данные юзера
	const { executeRecaptcha } = useGoogleReCaptcha();

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(createTicketFrontendSchema),
		defaultValues: {
			//Инициализируем значения по умолчанию:
			captchaToken: "1",
			email: user?.email || "",
			phone: user?.phone || "",
		},
	});

	//При размонтировании компонента ссылки на картинки нужно удалять
	useEffect(() => {
		return () => {
			// Очищаем временные URL, чтобы не забивать память
			files.forEach((file) => {
				if (file.type.startsWith("image/")) {
					URL.revokeObjectURL(URL.createObjectURL(file));
				}
			});
		};
	}, [files]);


	//----------------------Отправка формы:------------------------------------
	const onSubmit = async (data: createTicketServiceArgs) => {
		if (!executeRecaptcha) return;

		try {
			//1) Получаем токен капчи
			const captchaToken = await executeRecaptcha("support_form");

			//2) Формируем FormData (так как передаем файлы в форме):
			const formData = new FormData();
			//Добавляем основные данные:
			Object.keys(data).forEach((key) => {
				const typedKey = key as keyof createTicketServiceArgs;

				if (data[typedKey]) formData.append(key, data[typedKey]);
			});
			//Добавляем токен капчи:
			formData.set("captchaToken", captchaToken);
			//Добавляем файлы:
			files.forEach((file) => formData.append("files", file));

			//3) Отправка формы на бэкенд:
			await $api.post("/support/create", formData);

			//4) Очищаем форму
			// Сбрасываем текстовые поля формы:
			reset();
			//Очищаем состояние файлов в React:
			setFiles([]);
			//Очищаем визуально сам инпут (чтобы исчезла надпись "Выбрано файлов: Х"):
			const fileInput = document.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			if (fileInput) fileInput.value = "";

			//5) Положительное уведомление юзеру:
			toast.success("Ваше обращение принято! Мы ответим в ближайшее время.");
		} catch (e) {
			toast.error("Ошибка при отправке. Попробуйте позже.");
			console.log(`Произошла ошибка ${e}`)
		}
	};

	return (
		<>
			<form
				onSubmit={handleSubmit(
					onSubmit,
					(errors) => console.log("Ошибки валидации формы:", errors)
				)}
				className={styles.form}
			>
				<div className={styles.row}>
					{/* Имя */}
					<Input
						label="Ваше имя"
						visuallyHidden
						placeholder="Имя"
						registration={register("firstName")}
						error={errors.firstName}
						className={styles.nameInput}
					/>

					{/* Фамилия */}
					<Input
						label="Ваша фамилия"
						visuallyHidden
						placeholder="Фамилия"
						registration={register("lastName")}
						error={errors.lastName}
					/>
				</div>

				{/* Email */}
				<Input
					label="Ваш email"
					visuallyHidden
					placeholder="Email"
					readOnly={!!user}
					registration={register("email")}
					error={errors.email}
				/>

				{/*Номер телефона:*/}
				<PhoneInput
					control={control}
					error={errors.phone}
					id="phone"
				/>

				{/* Указание причины обращения */}
				<Select
					label="Выберите причину обращения"
					visuallyHidden
					placeholder="Выберите причину обращения"
					showPlaceholder={true}
					registration={register("category")}
					error={errors.category}
					options={REASON_OPTIONS}
					variant="light"
				/>

				{/* Область ввода сообщения */}
				<Textarea
					label="Введите ваш вопрос"
					visuallyHidden
					placeholder="Суть вопроса..."
					registration={register("description")}
					error={errors.description}
				/>


				{/*Кастомный инпут для файлов */}
				<FileUpload
					files={files}
					setFiles={setFiles}
					isDragActive={isDragActive}
					setIsDragActive={setIsDragActive}
					isUserLoggedIn={!!user}
				/>

				<Button
					type="submit"
					variant="primary" // Можно опустить, так как дефолтное значение "primary"
					isLoading={isSubmitting}
					loadingText="Отправка..."
					className={styles.subBtn}
				>
					Отправить запрос
				</Button>
			</form>
		</>
	);
};
