import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@repo/validation";

import { useProfile } from "@/features/auth/model/use-profile";
import { $api, API_URL } from "@/shared/api/api";
import { toast } from "react-hot-toast";

//Иконки и маски:
import { HiEye, HiEyeOff } from "react-icons/hi";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
} from "react-icons/hi";
import { IMaskInput } from "react-imask";
import IMask from "imask";
//Стили:
import styles from "./ProfilePage.module.scss";

export const ProfilePage = () => {
  const { user, isLoading, logout, logoutAll } = useProfile();
  const queryClient = useQueryClient(); // Пульт управления кэшем

  ////UI-состояния:
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  //Стейт для загрузки аватара:
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  //Для смены пароля:
  const [showPass, setShowPass] = useState(false);
  //Для удаления аккаунта:
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  //Для 2FA:
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  //Основная форма профиля:
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    values: {
      name: user?.name || "",
      phone: user?.phone || "",
      gender: user?.gender || null,
      // Превращаем строку из БД в объект Date для формы
      birthday: user?.birthday ? new Date(user.birthday) : null,
    },
  });

  //Форма смены пароля (используем алиасы, чтобы не было конфликта имен):
  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: isPassSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  console.log(`is2FAEnabled:`, user?.is2FAEnabled);

  //Сохранение данных профиля:
  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      let formattedBirthday = null;

      if (data.birthday instanceof Date && !isNaN(data.birthday.getTime())) {
        // Создаем копию даты, чтобы не мутировать стейт формы
        const date = new Date(data.birthday);
        // Устанавливаем время в 12:00 дня (полдень).
        // Это гарантирует, что при любом сдвиге часового пояса (даже -11 или +12)
        // дата останется тем же числом в формате UTC.
        date.setHours(12, 0, 0, 0);
        formattedBirthday = date.toISOString();
      }

      console.log(data.birthday);
      // Подготавливаем данные для отправки:
      const formattedData = {
        ...data,
        // Если в поле birthday лежит объект Date, превращаем его в "YYYY-MM-DD"
        // Если это Date — в ISO, иначе null
        // Если дата введена не полностью, шлем null, чтобы не было 400 ошибки
        birthday: formattedBirthday,
      };

      await $api.patch("/identity/profile/update", formattedData);

      //Инвалидируем кэш профиля - это заставит React Query фоново перекачать данные юзера:
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Профиль обновлен");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка обновления");
    }
  };

  //Загрузка аватара в профиле:
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    try {
      //Включаем лоадер:
      setIsAvatarLoading(true);

      await $api.post("/identity/profile/avatar", formData);

      //Инвалидируем кэш профиля.
      //(Теперь аватар обновится не только здесь, но и в Хедере,
      //и в любых других местах, где используется useProfile())
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Аватар обновлен");
      //Выходим из режима редактирования:
      setIsEditing(false);
    } catch (e) {
      toast.error("Ошибка загрузки файла");
    } finally {
      //Выключаем лоадер:
      setIsAvatarLoading(false);
    }
  };

  //Функция-обработчик ошибок валидации:
  const onFormError = (formErrors: any) => {
    console.log("ОШИБКИ ВАЛИДАЦИИ:", formErrors);

    // Берем первую ошибку из списка
    const fieldError = Object.values(formErrors)[0] as any;
    if (fieldError?.message) {
      toast.error(fieldError.message, { id: "validation-error" });
    }
  };

  //Для смены пароля:
  const onChangePassword = async (data: ChangePasswordInput) => {
    try {
      await $api.post("/identity/auth/change-password", data);
      toast.success("Пароль успешно изменен");
      resetPass(); // Очищаем поля после успеха
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка при смене пароля");
    }
  };

  //Для удаления аккаунта:
  const onDeleteAccount = async () => {
    try {
      await $api.delete("/identity/auth/delete-account", {
        data: { password: confirmPassword },
      });
      toast.success("Ваш аккаунт удален");
      await logout(); // Очищаем стор и уходим на главную
      //Используем logout() из нашего хука useProfile.
      // Он сделает запрос на бэкенд, очистит Zustand и ПОЛНОСТЬЮ сотрет кэш React Query,
      // чтобы данные удаленного юзера не "зависли" в памяти браузера.
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка при удалении");
    }
  };

  //Для 2FA:
  // Шаг 1: Запрос QR-кода
  const handleSetup2FA = async () => {
    try {
      const res = await $api.post("/identity/auth/2fa/setup");
      setQrCode(res.data.qrCodeUrl);
    } catch (e) {
      toast.error("Ошибка при генерации QR-кода");
    }
  };

  // Шаг 2: Подтверждение кода из приложения
  const handleEnable2FA = async () => {
    try {
      await $api.post("/identity/auth/2fa/enable", { code: verificationCode });
      toast.success("2FA успешно включена!");
      setQrCode(null);
      setVerificationCode("");

      //  Инвалидируем запрос профиля. React Query сам перекачает данные юзера,
      // и поле is2FAEnabled: true мгновенно обновит интерфейс (кнопка станет неактивной).
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Неверный код");
    }
  };

  // 1. Формируем правильный путь к аватару
  // Теперь берем user из useProfile()
  const avatarSrc = user?.avatarUrl?.startsWith("http")
    ? user.avatarUrl
    : `${API_URL}${user.avatarUrl}`;

  // 2. Логика для кнопки удаления (если нужно)
  // const isDeleteDisabled = confirmPassword.length < 6;

  // Если данные еще грузятся, можно показать лоадер на всю страницу
  if (isLoading) return <div>Загрузка профиля...</div>;
  if (!user) return <Navigate to="/auth" />; // Защита от "пустого" профиля

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div
          className={`${styles.avatarWrapper} ${isAvatarLoading ? styles.loading : ""}`}
          onClick={() =>
            isEditing && !isAvatarLoading && fileInputRef.current?.click()
          }
        >
          <img
            src={user?.avatarUrl ? avatarSrc : "/default-avatar.png"}
            alt="Avatar"
            referrerPolicy="no-referrer"
            style={{ opacity: isAvatarLoading ? 0.5 : 1 }} // Приглушаем фото при загрузке
          />
          {/* 4. Показываем спиннер поверх фото */}
          {isAvatarLoading && (
            <div className={styles.spinnerOverlay}>
              <div className={styles.spinner}></div>
            </div>
          )}

          {isEditing && !isAvatarLoading && (
            <div className={styles.avatarOverlay}>Сменить</div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

        <div className={styles.titleSection}>
          <h1>{user?.name}</h1>
          <p>{user?.role?.toLowerCase()}</p>
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

            {/*Поле даты рождения:*/}
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
                          // IMask сам поймет DD.MM.YYYY, если указать блоки
                          pattern="DD.MM.YYYY"
                          blocks={{
                            DD: { mask: IMask.MaskedRange, from: 1, to: 31 },
                            MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
                            YYYY: {
                              mask: IMask.MaskedRange,
                              from: 1900,
                              to: new Date().getFullYear(),
                            },
                          }}
                          // Важно: typedValue работает в паре с этими функциями
                          format={(date: Date) =>
                            date ? date.toLocaleDateString("ru-RU") : ""
                          }
                          parse={(str: string) => {
                            const [d, m, y] = str.split(".");
                            return new Date(
                              Number(y),
                              Number(m) - 1,
                              Number(d),
                            );
                          }}
                          // Самое главное:
                          value={
                            value instanceof Date
                              ? value.toLocaleDateString("ru-RU")
                              : ""
                          }
                          onAccept={(_, mask) => {
                            // typedValue вернет объект Date, если дата полная, или null
                            onChange(mask.typedValue);
                          }}
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

      {/*Смена пароля:*/}
      <div className={styles.card} style={{ marginTop: "24px" }}>
        <div className={styles.header}>
          <h2>Безопасность</h2>
        </div>

        <form onSubmit={handlePassSubmit(onChangePassword)}>
          <div className={styles.row}>
            <div className={styles.label}>Текущий пароль</div>
            <div className={styles.value}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPass ? "text" : "password"}
                  {...regPass("oldPassword")}
                  placeholder="••••••••"
                  className={passErrors.oldPassword ? styles.inputError : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={styles.eyeBtn}
                >
                  {showPass ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
              {passErrors.oldPassword && (
                <span className={styles.errorText}>
                  {passErrors.oldPassword.message}
                </span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>Новый пароль</div>
            <div className={styles.value}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPass ? "text" : "password"}
                  {...regPass("newPassword")}
                  placeholder="Минимум 6 символов"
                  className={passErrors.newPassword ? styles.inputError : ""}
                />
              </div>
              {passErrors.newPassword && (
                <span className={styles.errorText}>
                  {passErrors.newPassword.message}
                </span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>Повторите пароль</div>
            <div className={styles.value}>
              <div className={styles.passwordWrapper}>
                {" "}
                {/* Оборачиваем! */}
                <input
                  type={showPass ? "text" : "password"}
                  {...regPass("confirmPassword")}
                  placeholder="••••••••"
                  className={
                    passErrors.confirmPassword ? styles.inputError : ""
                  }
                />
              </div>
              {passErrors.confirmPassword && (
                <span className={styles.errorText}>
                  {passErrors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isPassSubmitting}
            >
              {isPassSubmitting ? "Обновление..." : "Обновить пароль"}
            </button>
          </div>
        </form>
      </div>
      {/*  */}

      {/*Удаление аккаунта:*/}
      <div className={styles.dangerZone}>
        <h3>Опасная зона</h3>
        <div className={styles.btnGroup}>
          {/* ... кнопки logout ... */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className={styles.deleteBtn}
          >
            Удалить аккаунт
          </button>
        </div>

        <div className={styles.btnGroup}>
          {/* Отображаем кнопку только для Админов */}
          {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
            <button
              onClick={user?.is2FAEnabled ? undefined : handleSetup2FA}
              className={user.is2FAEnabled ? styles.enabled2FA : styles.btn2FA}
              disabled={user.is2FAEnabled}
            >
              {user.is2FAEnabled ? "2FA Активна ✅" : "Включить 2FA"}
            </button>
          )}

          {/* ... твои кнопки выхода и удаления ... */}
        </div>
      </div>

      {/* Модальное окно настройки 2FA */}
      {qrCode && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Настройка защиты</h3>
            <p>Отсканируйте QR в Aegis или Google Authenticator</p>

            <div className={styles.qrWrapper}>
              <img src={qrCode} alt="QR Code" />
            </div>

            <input
              type="text"
              maxLength={6}
              placeholder="000 000"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              className={styles.otpInput}
            />

            <div className={styles.modalActions}>
              <button onClick={handleEnable2FA} className={styles.saveBtn}>
                Активировать
              </button>
              <button
                onClick={() => setQrCode(null)}
                className={styles.cancelBtn}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Простое модальное окно (можно потом вынести в UI Kit) */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Удаление аккаунта</h2>
            <p>Это действие необратимо. Введите пароль для подтверждения:</p>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ваш пароль"
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)}>Отмена</button>
              <button
                onClick={onDeleteAccount}
                className={styles.confirmDelete}
              >
                Я понимаю, удалить мой аккаунт
              </button>
            </div>
          </div>
        </div>
      )}
      {/*  */}

      <div className={styles.dangerZone}>
        <h3>Управление сессиями</h3>
        <div className={styles.btnGroup}>
          <button onClick={logout} className={styles.logoutBtn}>
            Выйти из аккаунта
          </button>
          <button onClick={logoutAll} className={styles.logoutAllBtn}>
            Выйти со всех устройств
          </button>
        </div>
      </div>
    </div>
  );
};
