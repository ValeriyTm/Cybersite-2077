import { useState, useRef } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateProfileSchema, type UpdateProfileInput } from "@repo/validation";
import { useAuth } from "@/features/auth/model/auth-store";
import { $api, API_URL } from "@/shared/api/api";
import { toast } from "react-hot-toast";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
} from "react-icons/hi";
import { IMaskInput } from "react-imask";
import IMask from "imask";
import { Controller } from "react-hook-form";
import styles from "./ProfilePage.module.scss";

export const ProfilePage = () => {
  const { user, setAuth, accessToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema) as Resolver<UpdateProfileInput>,
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      gender: user?.gender || null,
      birthday: user?.birthday ? new Date(user.birthday) : null,
    },
  });

  const onSubmit: SubmitHandler<UpdateProfileInput> = async (data) => {
    console.log("Данные из формы перед Axios:", data);

    try {
      // Подготавливаем данные для отправки:
      const formattedData = {
        ...data,
        // Если в поле birthday лежит объект Date, превращаем его в "YYYY-MM-DD"
        birthday:
          data.birthday instanceof Date
            ? data.birthday.toISOString()
            : data.birthday,
      };

      const response = await $api.patch(
        "/identity/profile/update",
        formattedData,
      );

      // Обновляем стор (там данные уже в формате ISO от сервера)
      setAuth({ ...user, ...response.data.user }, accessToken || "");

      toast.success("Профиль обновлен");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await $api.post("/identity/profile/avatar", formData);
      setAuth({ ...user, avatarUrl: res.data.avatarUrl }, accessToken || "");
      toast.success("Аватар обновлен");
    } catch (e) {
      toast.error("Ошибка загрузки файла");
    }
  };

  //Функция-обработчик ошибок валидации
  const onFormError = (formErrors: any) => {
    // Берем первую ошибку из списка
    const fieldError = Object.values(formErrors)[0] as any;
    if (fieldError?.message) {
      toast.error(fieldError.message, { id: "validation-error" });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div
          className={styles.avatarWrapper}
          onClick={() => isEditing && fileInputRef.current?.click()}
        >
          <img
            src={
              user?.avatarUrl
                ? `${API_URL}${user.avatarUrl}`
                : "/default-avatar.png"
            }
            alt="Avatar"
          />
          {isEditing && <div className={styles.avatarOverlay}>Сменить</div>}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

        <div className={styles.titleSection}>
          <h1>{user?.name}</h1>
          <p>{user?.role}</p>
        </div>

        {!isEditing && (
          <button
            className={styles.editMainBtn}
            onClick={() => setIsEditing(true)}
          >
            Редактировать профиль
          </button>
        )}
      </div>

      <div className={styles.infoGrid}>
        <form onSubmit={handleSubmit(onSubmit, onFormError)}>
          <div className={styles.card}>
            {/*Имя:*/}
            <div className={styles.row}>
              <div className={styles.label}>
                <HiOutlineUser /> Имя
              </div>
              <div className={styles.value}>
                {isEditing ? (
                  <>
                    <input
                      {...register("name")}
                      className={errors.name ? styles.inputError : ""}
                      placeholder="Ваше имя"
                    />
                    {/*Вывод ошибки:*/}
                    {errors.name && (
                      <span className={styles.errorText}>
                        {errors.name.message}
                      </span>
                    )}
                  </>
                ) : (
                  <span>{user?.name}</span>
                )}
              </div>
            </div>

            {/*Email:*/}
            <div className={styles.row}>
              <div className={styles.label}>
                <HiOutlineMail /> Email
              </div>
              <div className={styles.value}>
                <span className={styles.readonly}>{user?.email}</span>
              </div>
            </div>

            {/*Номер телефона:*/}
            <div className={styles.row}>
              <div className={styles.label}>
                <HiOutlinePhone /> Телефон{" "}
                {isEditing && <span className={styles.requiredStar}>*</span>}
              </div>
              <div className={styles.value}>
                {isEditing ? (
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
                    {/*Вывод ошибки:*/}
                    {errors.phone && (
                      <span className={styles.errorText}>
                        {errors.phone.message}
                      </span>
                    )}
                  </>
                ) : (
                  <span>{user?.phone || "Не указан"}</span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.label}>
                <HiOutlineCalendar /> День рождения{" "}
                {isEditing && <span className={styles.requiredStar}>*</span>}
              </div>
              <div className={styles.value}>
                {isEditing ? (
                  <>
                    <Controller
                      control={control}
                      name="birthday"
                      render={({ field: { onChange, value } }) => (
                        <IMaskInput
                          mask={Date}
                          pattern="d.m.Y"
                          blocks={{
                            d: { mask: IMask.MaskedRange, from: 1, to: 31 },
                            m: { mask: IMask.MaskedRange, from: 1, to: 12 },
                            Y: {
                              mask: IMask.MaskedRange,
                              from: 1900,
                              to: 2026,
                            },
                          }}
                          // ВАЖНО: передаем в форму объект Date, который IMask распарсил сам
                          onAccept={(_, mask) => {
                            const typed = (mask as unknown as { typedValue: Date | null }).typedValue;
                            onChange(typed ?? null);
                          }}
                          // Чтобы при загрузке данных дата из базы правильно отобразилась в маске
                          value={
                            value instanceof Date
                              ? value.toLocaleDateString("ru-RU")
                              : value || ""
                          }
                          className={
                            errors.birthday
                              ? styles.inputError
                              : styles.maskInput
                          }
                          placeholder="ДД.ММ.ГГГГ"
                        />
                      )}
                    />
                    {/*Вывод ошибки:*/}
                    {errors.birthday && (
                      <span className={styles.errorText}>
                        {errors.birthday.message}
                      </span>
                    )}
                  </>
                ) : (
                  <span>
                    {user?.birthday
                      ? new Date(user.birthday).toLocaleDateString("ru-RU")
                      : "Не указан"}
                  </span>
                )}
              </div>
            </div>
            {/* Примечание: Zod в  схеме строгий: он хочет 1995-05-20.
Пользователь хочет вводить 20.05.1995.
JS/Prisma работают с объектами new Date().
Решение: Мы используем маску для удобства ввода, а в onSubmit приводим всё к общему знаменателю (строке YYYY-MM-DD).
 */}

            <div className={styles.row}>
              <div className={styles.label}>
                <HiOutlineUser /> Пол{" "}
                {isEditing && <span className={styles.requiredStar}>*</span>}
              </div>
              <div className={styles.value}>
                {isEditing ? (
                  <select {...register("gender")} className={styles.select}>
                    <option value="">Не указан</option>
                    <option value="MALE">Мужской</option>
                    <option value="FEMALE">Женский</option>
                  </select>
                ) : (
                  <span>
                    {user?.gender === "MALE" && "Мужской"}
                    {user?.gender === "FEMALE" && "Женский"}
                    {!user?.gender && "Не указан"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={!isDirty}
              >
                Сохранить
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
