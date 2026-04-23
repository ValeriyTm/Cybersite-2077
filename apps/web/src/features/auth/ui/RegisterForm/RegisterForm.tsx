import { useState } from "react";
//React Hook Form:
import { useForm } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Библиотека всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Экземпляр axios:
import { $api } from "@/shared/api/api";
//Схемы валидации Zod:
import { RegisterFormSchema, type RegisterFormInput } from "@repo/validation";
//Компоненты:
import { PasswordField } from "@/shared/ui/PasswordField";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
//Кастомные хуки:
import { useAuthSubmit } from "@/features/auth/lib/useAuthSubmit";
//Стили:
import styles from "../AuthCard/AuthCard.module.scss";

export const RegisterForm = ({ onSuccess }: { onSuccess: () => void }) => {
  //Состояние для пароля (показывать его или нет):
  const [showPassword, setShowPassword] = useState(false);

  //Кастомный хук:
  const { handleAuthSubmit } = useAuthSubmit<RegisterFormInput>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    //Подключаем схему Zod (форма не отправится, пока данные не пройдут все проверки):
    resolver: zodResolver(RegisterFormSchema),
    mode: "onBlur", //валидация срабатывает, когда пользователь убирает курсор из поля.
    defaultValues: {
      captchaToken: "",
      //Устанавливаем начальное значение для токена капчи как отсутствующее
    },
  });

  // Функция, которая сработает, если Zod найдет ошибки (когда пользователь нажал «Зарегистрироваться», но ввел данные неверно):
  const onFormError = (errors: any) => {
    // Берем первую попавшуюся ошибку и выводим её в Toast
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message, {
        id: "form-validation-error", //Предотвращает спам уведомлениями - новое сообщение просто заменит старое.
      });
    }
  };

  const onSubmit = async (data: RegisterFormInput) => {
    await handleAuthSubmit(
      {
        action: "register",
        apiCall: (payload) => {
          //Очищаем данные прямо в вызове API:
          const { confirmPassword, acceptTerms, ...registerData } =
            payload as any;
          return $api.post("/identity/auth/register", registerData);
        },
        successMessage:
          "Регистрация успешна! Проверьте почту для активации аккаунта.",
        onSuccess: () => {
          //Очищаем форму (reset берем из useForm):
          reset();

          //Делаем задержку перед переключением на логин (onSuccess пришел из пропсов AuthCard):
          setTimeout(() => {
            onSuccess();
          }, 1500);
        },
      },
      data,
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      {/*handleSubmit — это обертка, которая сначала проверяет данные через Zod. Если всё ок — запускает onSubmit, если есть ошибки — вызывает onFormError (показ уведомлений).*/}

      {/*Поле ввода имени:*/}
      <Input
        label="Имя"
        placeholder="Иван"
        registration={register("name")}
        error={errors.name}
      />

      {/*Поле ввода email:*/}
      <Input
        label="Email"
        type="email"
        placeholder="mail@example.com"
        registration={register("email")}
        error={errors.email}
      />

      {/*Поле ввода пароля:*/}
      <PasswordField
        label="Пароль"
        registration={register("password")}
        error={errors.password}
        placeholder="••••••••"
      />

      {/*Поле ввода пароля для подтверждения:*/}
      <PasswordField
        label="Подтвердить пароль"
        registration={register("confirmPassword")}
        error={errors.confirmPassword}
        placeholder="••••••••"
      />

      {/*Чекбокс с согласиями:*/}
      <div className={styles.checkboxField}>
        <input type="checkbox" id="terms" {...register("acceptTerms")} />
        <label htmlFor="terms">
          Я даю{" "}
          <a href="/terms" target="_blank">
            Согласие на обработку персональных данных
            <span className="visually-hidden">Откроется в новой вкладке</span>
          </a>{" "}
          и принимаю условия{" "}
          <a href="/privacy" target="_blank">
            Политики конфиденциальности
            <span className="visually-hidden">Откроется в новой вкладке</span>
          </a>
        </label>
        {errors.acceptTerms && (
          <span className={styles.errorText}>{errors.acceptTerms.message}</span>
        )}
      </div>

      <div className={styles.btnGroup}>
        {/*Кнопка отправки:*/}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          loadingText="Регистрируемся..."
        >
          Зарегистрироваться
        </Button>

        {/* Кнопка сброса формы:*/}
        <Button
          type="button"
          variant="secondary"
          isLoading={isSubmitting}
          loadingText="Очищаем..."
          onClick={() => reset()}
        >
          Очистить форму
        </Button>
      </div>
    </form>
  );
};
