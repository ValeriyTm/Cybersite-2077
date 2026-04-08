import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicketSchema } from "@repo/validation";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { $api } from "@/shared/api/api";
import toast from "react-hot-toast";
import styles from "./SupportPage.module.scss";
import { HiOutlinePhone } from "react-icons/hi";
import { IMaskInput } from "react-imask";
import { Controller } from "react-hook-form";
import { useProfile } from "@/features/auth/model/useProfile";
import { Link } from "react-router";

export const SupportPage = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useProfile();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      //Инициализируем значения по умолчанию:
      captchaToken: "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: any) => {
    if (!executeRecaptcha) return;

    try {
      //1) Получаем токен капчи
      const captchaToken = await executeRecaptcha("support_form");

      //2) Формируем FormData (так как передаем файлы в форме):
      const formData = new FormData();
      //Добавляем основные данные:
      Object.keys(data).forEach((key) => {
        if (data[key]) formData.append(key, data[key]);
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
    }
  };

  return (
    <div className={styles.supportWrapper}>
      <h1>Служба поддержки</h1>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <input
              {...register("firstName")}
              placeholder="Имя"
              className={errors.firstName ? styles.inputError : ""}
            />
            {errors.firstName && (
              <span className={styles.errorMessage}>
                {errors.firstName.message}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <input
              {...register("lastName")}
              placeholder="Фамилия"
              className={errors.lastName ? styles.inputError : ""}
            />
            {errors.lastName && (
              <span className={styles.errorMessage}>
                {errors.lastName.message}
              </span>
            )}
          </div>
        </div>
        <div className={styles.inputGroup}>
          <input
            {...register("email")}
            placeholder="Email"
            readOnly={!!user} //Запрещаем менять email, если юзер в системе
            className={errors.email ? styles.inputError : ""}
          />
          {errors.email && (
            <span className={styles.errorMessage}>{errors.email.message}</span>
          )}
        </div>

        {/*Номер телефона:*/}
        <div className={styles.rowMobile}>
          <div className={styles.label}>
            <HiOutlinePhone /> Телефон{" "}
          </div>
          <div className={styles.value}>
            <>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <IMaskInput
                    mask="+{7} (000) 000-00-00"
                    value={value || ""}
                    onAccept={(val) => onChange(val)} // Передаем значение в форму
                    className={
                      errors.phone ? styles.inputError : styles.maskInput
                    }
                  />
                )}
              />
            </>
            {errors.phone && (
              <span className={styles.errorMessage}>
                {errors.phone.message}
              </span>
            )}
          </div>
        </div>

        <select {...register("category")}>
          <option value="">Выберите причину</option>
          <option value="TECHNICAL">Техническая ошибка</option>
          <option value="ORDER">Вопрос по заказу</option>
          <option value="COOPERATION">Сотрудничество</option>
          <option value="COMPLAINT">Жалоба</option>
          <option value="OTHER">Другое</option>
        </select>
        {errors.category && (
          <span className={styles.errorMessage}>
            Выберите причину обращения
          </span>
        )}
        <textarea
          {...register("description")}
          placeholder="Суть вопроса..."
          className={errors.description ? styles.inputError : ""}
        />
        {errors.description && (
          <span className={styles.errorMessage}>
            {errors.description.message}
          </span>
        )}

        {/*Кастомный инпут для файлов */}
        {user ? (
          <div className={styles.fileUpload}>
            <label className={styles.fileLabel}>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                accept=".jpg,.png,.pdf,.doc,.docx,.txt"
              />
              <div className={styles.icon}>📎</div>
              <span>Нажмите, чтобы прикрепить файлы (PDF, DOC, TXT, PNG)</span>
            </label>
            <p>Прикреплено файлов: {files.length}</p>
          </div>
        ) : (
          <div className={styles.fileUploadDisabled}>
            <p>
              🔒 <Link to="/auth">Войдите</Link>, чтобы прикрепить документы к
              обращению
            </p>
          </div>
        )}

        <button type="submit" className={styles.subBtn} disabled={isSubmitting}>
          {isSubmitting ? "Отправка..." : "Отправить запрос"}
        </button>
      </form>
    </div>
  );
};
