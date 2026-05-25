//Типы:
import { type UseFormReturn } from "react-hook-form";
import { type ChangePasswordType } from "@repo/validation";
//Компоненты:
import { PasswordField, Button } from "@/shared/ui";
//Стили:
import styles from "./ChangePasswordCard.module.scss";

interface ChangePasswordCardProps {
  passForm: UseFormReturn<ChangePasswordType>;
  onChangePassword: (data: ChangePasswordType) => Promise<void>;
}

export const ChangePasswordCard = ({ passForm, onChangePassword }: ChangePasswordCardProps) => {
  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    formState: { errors: passErrors, isSubmitting: isPassSubmitting },
  } = passForm;

  return (
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
  );
};
