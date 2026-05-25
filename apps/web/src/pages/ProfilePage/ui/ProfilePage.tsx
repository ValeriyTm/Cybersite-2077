//Роутер:
import { Navigate } from "react-router";
//Состояния:
import { ChangePasswordCard, DeleteAccountCard, ProfileHeader, SessionManagementCard, TwoFactorAuthCard, useProfile, useProfileActions } from "@/features/auth";
//Компоненты:
import { TwoFactorModal, DeleteAccountModal } from "@/features/auth";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./ProfilePage.module.scss";
import { SupportTicketsCard } from "@/features/support/ui/SupportTicketsCard";
import { ProfileInfoCard } from "@/widgets/ProfileInfoCard";

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

  //Методы и состояния из формы удаления аккаунта:
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

          {/*2) Форма персональных данных:*/}
          <ProfileInfoCard
            user={user}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            profileForm={profileForm}
            onSubmit={onSubmit}
            onFormError={onFormError}
          />

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
              onSubmit={handleSubmit(onDeleteAccount)}
              registration={register("password")}
              error={errors.password}
              isLoading={isSubmitting}
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
