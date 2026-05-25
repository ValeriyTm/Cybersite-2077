//Роутер:
import { Navigate } from "react-router";
//Состояния:
import { ChangePasswordCard, DeleteAccountCard, ProfileHeader, SessionManagementCard, TwoFactorAuthCard, useProfile, useProfileActions } from "@/features/auth";
//Иконки:
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
} from "react-icons/hi";
//Компоненты:
import { TwoFactorModal, DeleteAccountModal } from "@/features/auth";
import { Input, Button } from "@/shared/ui";
import { BirthdayInput, PhoneInput } from "./components";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./ProfilePage.module.scss";
import { SupportTicketsCard } from "@/features/support/ui/SupportTicketsCard";

export const ProfilePage = () => {
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
    formState: { errors, isSubmitting },
  } = profileForm;

  // Извлекаем методы и состояния из формы удаления аккаунта:
  const {
    register: regDelete,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deleteErrors, isSubmitting: isDeleting },
  } = deleteForm;

  //Если данных о юзере нет, то перекидываем его на форму регистрации-логина:
  if (!user) return <Navigate to="/auth" />;

  // Если данные еще грузятся, можно показать лоадер на всю страницу:
  if (isLoading) return <div>Загрузка профиля...</div>;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Мой профиль</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className={styles.profilePage}>
        <div className={styles.container}>
          {/*1) Блок с именем, аватаром и кнопкой редактирования: */}
          <ProfileHeader
            name={user?.name || ""}
            role={user?.role}
            avatarSrc={avatarSrc}
            isAvatarLoading={isAvatarLoading}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onAvatarChange={handleAvatarChange}
          />

          {/*2) Форма с персональными данными:*/}
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
                      <Input
                        registration={register("name")}
                        error={errors.name}
                        label='Поле ввода имени'
                        visuallyHidden={true}
                      />
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
                {isEditing ? (
                  <PhoneInput control={control} error={errors.phone} />
                ) : (
                  <div className={styles.row}>
                    <div className={styles.label}><HiOutlinePhone />&nbsp;&nbsp;&nbsp;Телефон</div>
                    <div className={styles.value}>
                      <span>{user?.phone || "Не указан"}</span>
                    </div>
                  </div>
                )}

                {/*Поле даты рождения:*/}
                {isEditing ? (
                  <BirthdayInput control={control} error={errors.birthday} />
                ) : (
                  <div className={styles.row}>
                    <div className={styles.label}>
                      <HiOutlineCalendar />День рождения
                    </div>
                    <div className={styles.value}>
                      <span>
                        {user?.birthday ? new Date(user.birthday).toLocaleDateString("ru-RU") : "Не указан"}
                      </span>
                    </div>
                  </div>
                )}

                {/*Пол:*/}
                <div className={styles.row}>
                  <div className={styles.label}>
                    <HiOutlineUser /> Пол{" "}
                    {isEditing && <span className={styles.requiredStar}>*</span>}
                  </div>
                  <div className={styles.value}>
                    {isEditing ? (
                      <>
                        <label htmlFor="gender-select" className="visually-hidden">Выбор пола</label>
                        <select id="gender-select" {...register("gender")} className={styles.select}>
                          <option value="">Не указан</option>
                          <option value="MALE">Мужской</option>
                          <option value="FEMALE">Женский</option>
                        </select>
                      </>
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

          {/*3) Секция смены пароля:*/}
          <ChangePasswordCard
            passForm={passForm}
            onChangePassword={onChangePassword}
          />

          {/*4) Секция включения 2FA:*/}
          {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
            <TwoFactorAuthCard
              is2FAEnabled={!!user?.is2FAEnabled}
              onSetup2FA={handleSetup2FA}
            />
          )}

          {/*5) Модальное окно настройки 2FA */}
          {qrCode && (
            <TwoFactorModal
              qrCode={qrCode}
              verificationCode={verificationCode}
              setVerificationCode={setVerificationCode}
              onActivate={handleEnable2FA}
              onClose={() => setQrCode(null)}
            />
          )}

          {/*6) Модальное окно для удаления аккаунта:*/}
          {showDeleteModal && (
            <DeleteAccountModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onSubmit={handleDeleteSubmit(onDeleteAccount)}
              registration={regDelete("password")}
              error={deleteErrors.password}
              isLoading={isDeleting}
            />
          )}

          {/*7) Управление сессиями:*/}
          <SessionManagementCard
            onLogout={logout}
            onLogoutAll={logoutAll}
          />

          {/*8) Вопросы поддержке: */}
          <SupportTicketsCard />

          {/*9) Удаление аккаунта:*/}
          <DeleteAccountCard onOpenDeleteModal={() => setShowDeleteModal(true)} />
        </div >
      </div >
    </>
  );
};
