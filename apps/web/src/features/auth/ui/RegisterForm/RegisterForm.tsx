//React Hook Form:
import { useForm, type FieldErrors } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Обработчик ошибок формы:
import { handleFormError } from "@/shared/lib";
//API:
import { $api } from "@/shared/api";
//Схемы валидации Zod:
import { RegisterFormSchema, type RegisterFormType } from "@repo/validation";
//Компоненты:
import { Button, Checkbox, Input, PasswordField } from "@/shared/ui";
//Состояния:
import { useAuthSubmit } from "@/features/auth";
//Стили:
import styles from "./RegisterForm.module.scss";

export const RegisterForm = ({ onSuccess }: { onSuccess: () => void }) => {

  //Кастомный хук:
  const { handleAuthSubmit } = useAuthSubmit<RegisterFormType>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormType>({
    //Подключаем схему Zod (форма не отправится, пока данные не пройдут все проверки):
    resolver: zodResolver(RegisterFormSchema),
    mode: "onBlur", //валидация срабатывает, когда пользователь убирает курсор из поля.
    defaultValues: {
      captchaToken: "1",
      //Устанавливаем начальное значение для токена капчи как отсутствующее
    },
  });

  //Работа с ошибками формы:
  const onFormError = (errors: FieldErrors<RegisterFormType>) =>
    handleFormError(errors, "form-validation-error");

  const onSubmit = async (data: RegisterFormType) => {
    await handleAuthSubmit(
      {
        action: "register",
        apiCall: (payload) => {
          //ESLint настроен в режиме максимальной строгости, поэтому заткнем его, чтобы не ругался на неиспользуемые переменные:
          //eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars
          const { confirmPassword, acceptTerms, ...registerData } = payload;

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
          }, 500);
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
      <Checkbox
        label={
          <>
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
          </>
        }
        registration={register("acceptTerms")}
        error={errors.acceptTerms}
        smallText
      />

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
