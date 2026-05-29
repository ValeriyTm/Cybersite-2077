//Типы:
import { type FieldErrors, } from "react-hook-form";
import { type UpdateProfileFormType, type UpdateProfileType } from "@repo/validation";
import { type IUser } from "@repo/types";
//Компоненты:
import { Input, Button } from "@/shared/ui";
import { BirthdayInput } from "@/features/auth";
import { PhoneInput } from "@/shared/ui";
//Иконки:
import { HiOutlineUser, HiOutlineMail } from "react-icons/hi";
//Стили:
import styles from "./ProfileInfoCard.module.scss";

interface ProfileInfoCardProps {
  user: IUser | null | undefined;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  profileForm: UpdateProfileFormType;
  onSubmit: (data: UpdateProfileType) => Promise<void>;
  onFormError: (errors: FieldErrors<UpdateProfileType>) => void;
}

export const ProfileInfoCard = ({
  user,
  isEditing,
  setIsEditing,
  profileForm,
  onSubmit,
  onFormError,
}: ProfileInfoCardProps) => {

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = profileForm;

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className={styles.card}>

        {/* Имя */}
        <div className={styles.row}>
          <div className={styles.label}><HiOutlineUser /> Имя</div>
          <div className={styles.value}>
            {isEditing ? (
              <Input registration={register("name")} error={errors.name} label="Поле ввода имени" visuallyHidden center />
            ) : (
              <span>{user?.name}</span>
            )}
          </div>
        </div>

        {/* Email */}
        <div className={styles.row}>
          <div className={styles.label}><HiOutlineMail /> Email</div>
          <div className={styles.value}>
            <span className={styles.readonly}>{user?.email}</span>
          </div>
        </div>

        {/* Номер телефона */}
        {isEditing ? (
          <PhoneInput
            control={control}
            error={errors.phone}
            required={true}
            center
          />
        ) : (
          <div className={styles.row}>
            <div className={styles.label}><HiOutlineUser /> Телефон</div>
            <div className={styles.value}><span>{user?.phone || "Не указан"}</span></div>
          </div>
        )}

        {/* День рождения */}
        {isEditing ? (
          <BirthdayInput control={control} error={errors.birthday} />
        ) : (
          <div className={styles.row}>
            <div className={styles.label}><HiOutlineUser /> День рождения</div>
            <div className={styles.value}>
              <span>{user?.birthday ? new Date(user.birthday).toLocaleDateString("ru-RU") : "Не указан"}</span>
            </div>
          </div>
        )}

        {/* Пол */}
        <div className={styles.row}>
          <div className={styles.label}><HiOutlineUser /> Пол {isEditing && <span className={styles.requiredStar}>*</span>}</div>
          <div className={styles.value}>
            {isEditing ? (
              <label>
                <span className="visually-hidden">Выбор пола</span>
                <select {...register("gender")} className={styles.select}>
                  <option value="">Не указан</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </label>
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

      {/* Кнопки управления режимом редактирования */}
      {isEditing && (
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); reset(); }}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" bold isLoading={isSubmitting} loadingText="Сохраняем...">
            Сохранить
          </Button>
        </div>
      )}
    </form>
  );
};
