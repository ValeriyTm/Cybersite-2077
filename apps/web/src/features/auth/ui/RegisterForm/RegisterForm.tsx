//React Hook Form:
import { useForm } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Схемы валидации Zod:
import { RegisterFormSchema, type RegisterFormType } from "@repo/validation";
//Компоненты:
import { Button, Checkbox, Input, PasswordField } from "@/shared/ui";
//Стили:
import styles from "./RegisterForm.module.scss";

export const RegisterForm = () => {

  const {
    register,
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

  return (
    <form>
      {/*Поле ввода имени:*/}
      <Input
        label="Имя"
        placeholder="Иван"
        registration={register("name")}
        error={errors.name}
        disabled
      />

      {/*Поле ввода email:*/}
      <Input
        label="Email"
        type="email"
        placeholder="mail@example.com"
        registration={register("email")}
        error={errors.email}
        disabled
      />

      {/*Поле ввода пароля:*/}
      <PasswordField
        label="Пароль"
        registration={register("password")}
        error={errors.password}
        placeholder="••••••••"
        disabled
      />

      {/*Поле ввода пароля для подтверждения:*/}
      <PasswordField
        label="Подтвердить пароль"
        registration={register("confirmPassword")}
        error={errors.confirmPassword}
        placeholder="••••••••"
        disabled
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
        disabled
      />

      <div className={styles.btnGroup}>
        {/*Кнопка отправки:*/}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          loadingText="Регистрируемся..."
          disabled
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
          disabled
        >
          Очистить форму
        </Button>
      </div>
    </form>
  );
};
