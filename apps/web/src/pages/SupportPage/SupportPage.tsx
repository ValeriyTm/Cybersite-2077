//Состояния:
import { useEffect, useState } from "react";
import { useProfile } from "@/features/auth/model/useProfile";
//Валидация:
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicketSchema } from "@repo/validation";
//API:
import { API_URL, $api } from "@/shared/api/api";
//SEO:
import { Helmet } from "react-helmet-async";
//Работа с формами:
import { Controller, useForm } from "react-hook-form";
import { IMaskInput } from "react-imask";
//Роутинг:
import { Link } from "react-router";
//reCAPTCHA:
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
//Компоненты:
import { HiOutlinePhone } from "react-icons/hi";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from "./SupportPage.module.scss";

export const SupportPage = () => {
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
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      //Инициализируем значения по умолчанию:
      captchaToken: "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  //-------------------------------------------
  //Удаление прикрепленного файла:
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };


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

  //-----------------Обработчики событий для Drag'n'Drop:-----------------------
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Соединяем новые файлы с уже выбранными (если нужно) или просто заменяем:
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  //----------------------Отправка формы:------------------------------------
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

  //----------SEO:-------------//
  const canonicalUrl = `${API_URL}/support`;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Поддержка</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
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
              <label
                className={`${styles.fileLabel} ${isDragActive ? styles.dragActive : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  accept=".jpg,.png,.pdf,.doc,.docx,.txt"
                />
                <div className={styles.icon}>{isDragActive ? "📥" : "📎"}</div>
                <span>Нажмите или перетащите файлы сюда</span>
              </label>

              {/*Блок предпросмотра:*/}
              {files.length > 0 && (
                <div className={styles.previewGrid}>
                  {files.map((file, index) => (
                    <div key={index} className={styles.previewItem}>
                      <div className={styles.previewContent}>
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            className={styles.thumb}
                          />
                        ) : (
                          <div className={styles.fileIcon}>📄</div>
                        )}
                        <span className={styles.fileName}>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className={styles.fileCount}>
                Прикреплено файлов: <strong>{files.length}</strong>
              </p>
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
    </>
  );
};
