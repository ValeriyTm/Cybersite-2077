//React Hook Form:
import { useForm, type SubmitHandler, type FieldErrors } from "react-hook-form";
//Библиотека для всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Схемы валидации Zod:
import { LoginFrontendSchema, type LoginFormType } from "@repo/validation";
//Состояния:
import { useState } from "react";
import { useAuthSubmit, useAuthStore } from "@/features/auth";
//API:
import { $api } from "@/shared/api/api";
//Обработчик ошибок формы:
import { handleFormError } from "@/shared/lib";
//Компоненты:
import { Checkbox, PasswordField } from "@/shared/ui";
import { Button, Input } from "@/shared/ui";
import { TwoFactorVerifyForm } from "../TwoFactorVerifyForm";
//Стили:
import styles from "./LoginForm.module.scss";

interface Props {
  onSuccess: () => void;
  onVerify2FA?: () => void;
}

export const LoginForm = ({ onSuccess, onVerify2FA }: Props) => {
  const { setAuth, setTempUserId, tempUserId } = useAuthStore();
  const { handleAuthSubmit } = useAuthSubmit<LoginFormType>();
  const [show2FA, setShow2FA] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormType>({
    resolver: zodResolver(LoginFrontendSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
      captchaToken: "1",
    },
  });

  //Работа с ошибками формы:
  const onFormError = (errors: FieldErrors<LoginFormType>) =>
    handleFormError(errors, "login-validation-error");

  //Отправка формы:
  const onSubmit: SubmitHandler<LoginFormType> = async (data: LoginFormType) => {
    //Добавляем await, чтобы сработало переключение isSubmitting:
    await handleAuthSubmit(
      {
        action: "login",
        apiCall: (payload) => $api.post("/identity/auth/login", payload),
        //Тут обрабатываем случай 2FA:
        onSuccess: (res) => {
          // Если сервер говорит, что нужна 2FA:
          if (res.data.requires2FA) {
            const id = res.data.userId;

            setTempUserId(id); // Для истории в сторе
            setShow2FA(true); // Переключаем интерфейс на ввод кода (устанавливаем переменную необходимости показа окна 2FA как true)

            toast.success("Введите 6-значный код из приложения");
            return; // Прерываем выполнение, чтобы далее не срабатывал основной вход (именно этот обработчик)
          }

          // Если 2FA не нужна — просто логинимся:
          if (res.data.accessToken) {
            setAuth(res.data.accessToken); //Устанавливаем access token в клиентский store.
            toast.success("С возвращением!");
          }
        },
      },
      data,
    );
  };

  //Если для пользователя включена 2FA, то показываем только поле для 6-значного кода (окно 2FA):
  if (show2FA) {
    return (
      <TwoFactorVerifyForm
        userId={tempUserId}
        onSuccess={onVerify2FA || onSuccess} // Если 2FA успешно — вызываем колбэк
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)} className={styles.form}>
      {/*Поле ввода email:*/}
      <Input
        label="Email"
        type="email"
        placeholder="watcher@example.com"
        registration={register("email")}
        error={errors.email}
      />

      {/*Поле ввода пароля:*/}
      <PasswordField
        label={
          <div className={styles.labelWithLink}>
            <span>Пароль</span>
            <a href="" className={styles.forgotLink} title='Недоступно во избежание нарушения 152ФЗ'>
              Забыли пароль?
            </a>
          </div>
        }
        registration={register("password")}
        error={errors.password}
        placeholder="••••••••"
      />

      {/* Контейнер "Запомнить меня" */}
      <Checkbox
        label="Запомнить меня"
        registration={register("rememberMe")}
      />

      {/*Кнопка отправки формы:*/}
      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        loadingText="Входим..."
      >
        Войти
      </Button>
    </form>
  );
};
