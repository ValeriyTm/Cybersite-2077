import { useRef } from "react";
//React Hook Form:
import { Controller } from "react-hook-form";
//Роутер:
import { Navigate } from "react-router";
import { Link } from "react-router";
//Серверное хранилище:
import { useProfile } from "@/features/auth/model/useProfile";
//Иконки:
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
} from "react-icons/hi";
//Библиотека для работы с масками в инпутах:
import { IMaskInput } from "react-imask";
import IMask from "imask";
//Кастомный хук:
import { useProfileActions } from "@/features/auth/lib/useProfileActions";
//Компоненты:
import { PasswordField } from "@/shared/ui/PasswordField";
import { Button } from "@/shared/ui/Button";
import { TwoFactorModal } from "@/features/auth/ui/TwoFactorModal";
import { DeleteAccountModal } from "@/features/auth/ui/DeleteAccountModal";
import { Avatar } from "@/shared/ui/Avatar";
import { Input } from "@/shared/ui/Input";
//Стили:
import styles from "./ProfilePage.module.scss";

export const ProfilePage = () => {
  //Используем состояния из серверного хранилища:
  const { user, isLoading, logout, logoutAll } = useProfile();

  const {
    isEditing,
    setIsEditing,
    showDeleteModal,
    setShowDeleteModal,
    qrCode,
    setQrCode,
    verificationCode,
    setVerificationCode,
    profileForm,
    passForm,
    deleteForm,
    onSubmit,
    onFormError,
    handleAvatarChange,
    onChangePassword,
    onDeleteAccount,
    handleSetup2FA,
    handleEnable2FA,
    isAvatarLoading,
    avatarSrc,
  } = useProfileActions(user);

  //Извлекаем методы основной формы профиля:
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = profileForm;

  //Извлекаем методы формы смены пароля (используем алиасы, чтобы не было конфликта имен):
  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    formState: { errors: passErrors, isSubmitting: isPassSubmitting },
  } = passForm;

  // Извлекаем методы и состояния из формы удаления аккаунта:
  const {
    register: regDelete,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deleteErrors, isSubmitting: isDeleting },
  } = deleteForm;

  const fileInputRef = useRef<HTMLInputElement>(null); //Ссылка на инпут загрузки аватара

  // Если данные еще грузятся, можно показать лоадер на всю страницу:
  if (isLoading) return <div>Загрузка профиля...</div>;
  //Если данных о юзере нет, то перекидываем его на форму регистрации-логина:
  if (!user) return <Navigate to="/auth" />; // Защита от "пустого" профиля

  return (
    <div className={styles.container}>
      {/*Блок с именем, аватаром и кнопкой редактирования:*/}
      <div className={styles.profileHeader}>
        <Avatar
          src={avatarSrc}
          isAvatarLoading={isAvatarLoading}
          isEditing={isEditing}
          onClick={() =>
            isEditing && !isAvatarLoading && fileInputRef.current?.click()
          }
        />
        {/*Инпут для загрузки аватара:*/}
        <input
          type="file"
          ref={fileInputRef} //Ссылка на этот элемент
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
        {/*Отображаем имя и роль пользователя:*/}
        <div className={styles.titleSection}>
          <h1>{user?.name}</h1>
          <p>{user?.role?.toLowerCase()}</p>
        </div>

        {!isEditing && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditing(true)}
          >
            Редактировать профиль
          </Button>
        )}
      </div>

      {/*Форма с персональными данными:*/}
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
                    <Input
                      registration={register("name")}
                      error={errors.name}
                    />
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
                {/*Если включен режим редактирования, показываем звездочку, указывая, что поле обязательно к заполнению:*/}
                {isEditing && <span className={styles.requiredStar}>*</span>}
              </div>
              <div className={styles.value}>
                {isEditing ? (
                  <>
                    {/*<Controller /> — Компонент из RHF. Он нужен, чтобы подружить IMask с состоянием формы:*/}
                    <Controller
                      control={control}
                      name="birthday"
                      render={({ field: { onChange, value } }) => (
                        <IMaskInput
                          mask={Date} //Указываем, что работаем с типом данных "Дата"
                          //IMask сам поймет DD.MM.YYYY, если указать блоки:
                          pattern="DD.MM.YYYY"
                          blocks={{
                            //Ограничиваем ввод:
                            DD: { mask: IMask.MaskedRange, from: 1, to: 31 },
                            MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
                            YYYY: {
                              mask: IMask.MaskedRange,
                              from: 1900,
                              to: new Date().getFullYear(),
                            },
                          }}
                          //При помощи format и value переводим объект Date в строку ДД.ММ.ГГГГ (которую видит юзер) и обратно:
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
                          //Гарантируем, что инпут всегда отображает дату в понятном русском формате, если она есть в базе:
                          value={
                            value instanceof Date
                              ? value.toLocaleDateString("ru-RU")
                              : ""
                          }
                          //При каждом вводе символа маска пытается создать реальный объект Date. Как только дата введена полностью, она попадает в форму, если стерта — в форму уходит null:

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

            {/*Пол:*/}
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                loadingText="Сохраняем..."
              >
                Сохранить
              </Button>
            </div>
          )}
        </form>
      </div>

      {/*Секция смены пароля:*/}
      <div className={styles.card} style={{ marginTop: "24px" }}>
        <div className={styles.header}>
          <h2>Безопасность</h2>
        </div>
        <form onSubmit={handlePassSubmit(onChangePassword)}>
          <PasswordField
            label="Текущий пароль"
            registration={regPass("oldPassword")}
            error={passErrors.oldPassword}
          />

          <PasswordField
            label="Новый пароль"
            placeholder="Минимум 8 символов"
            registration={regPass("newPassword")}
            error={passErrors.newPassword}
          />

          <PasswordField
            label="Повторите пароль"
            registration={regPass("confirmPassword")}
            error={passErrors.confirmPassword}
          />

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="outline"
              isLoading={isPassSubmitting}
              loadingText="Обновление..."
            >
              Обновить пароль
            </Button>
          </div>
        </form>
      </div>
      {/*  */}

      {/*Удаление аккаунта:*/}
      <div className={styles.dangerZone}>
        <h3>Опасная зона</h3>
        <div className={styles.btnGroup}>
          {/*Сюда когда-нибудь можно переместить кнопки управления сессиями*/}

          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Удалить аккаунт
          </Button>
        </div>

        {/*Кнопка включения 2FA:*/}
        <div className={styles.btnGroup}>
          {/* Отображаем кнопку только для Админов */}
          {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
            <button
              onClick={user?.is2FAEnabled ? undefined : handleSetup2FA}
              className={user.is2FAEnabled ? styles.enabled2FA : styles.btn2FA}
              disabled={user.is2FAEnabled}
            >
              {user.is2FAEnabled ? "2FA Активна ✅" : "Включить 2FA 🛡️"}
            </button>
          )}
        </div>
      </div>

      {/* Модальное окно настройки 2FA */}
      {qrCode && (
        <TwoFactorModal
          qrCode={qrCode}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          onActivate={handleEnable2FA}
          onClose={() => setQrCode(null)}
          // isLoading={is2FALoading}
        />
      )}

      {/*Модальное окно для удаления аккаунта:*/}
      {showDeleteModal && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSubmit={handleDeleteSubmit(onDeleteAccount)}
          registration={regDelete("confirmPassword")}
          error={deleteErrors.confirmPassword}
          isLoading={isDeleting}
        />
      )}

      {/*Управление сессиями:*/}
      <div className={styles.dangerZone}>
        <h3>Управление сессиями</h3>
        <div className={styles.btnGroup}>
          <Button type="button" variant="secondary" onClick={logout}>
            Выйти из аккаунта
          </Button>

          <Button type="button" variant="danger" onClick={logoutAll}>
            Выйти со всех устройств
          </Button>
        </div>
      </div>

      <Link to="/support/tickets" style={{ marginRight: "10px" }}>
        В тикеты
      </Link>
    </div>
  );
};
