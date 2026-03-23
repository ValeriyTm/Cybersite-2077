import { useState } from "react";
//React Hook Form:
import { useForm } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Библиотека всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Иконки:
import { HiEye, HiEyeOff } from "react-icons/hi";
//Google reCAPTCHA v3:
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
//Экземпляр axios:
import { $api } from "@/shared/api/api";
//Схемы валидации Zod:
import { RegisterFormSchema, type RegisterFormInput } from "@repo/validation";

import styles from "../AuthCard/AuthCard.module.scss";

export const RegisterForm = ({ onSuccess }: { onSuccess: () => void }) => {
  //Состояние для пароля (показывать его или нет):
  const [showPassword, setShowPassword] = useState(false);

  //Подключаем Google Captcha (функция executeRecaptcha будет генерировать невидимый токен проверки):
  const { executeRecaptcha } = useGoogleReCaptcha();

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
    //1) Ждем токен от Google.  Если сервис капчи не прогрузился, регистрация блокируется.
    if (!executeRecaptcha) {
      toast.error("Капча еще не загружена");
      return;
    }

    try {
      //2) Получаем токен действия 'register':
      const captchaToken = await executeRecaptcha("register");

      //3) Извлекаем лишния поля confirmPassword и acceptTerms (они нужно только для валидации на фронте), а
      //registerData будет содержать только то, что ждет сервер (email, name, password):
      const { confirmPassword, acceptTerms, ...registerData } = data as any;

      //4) Отправляем на сервер очищенные от лишних полей данные:
      await $api.post("/identity/auth/register", {
        ...registerData,
        //Прикладываем токен капчи:
        captchaToken,
      });

      //5) Показываем уведомление
      toast.success(
        "Регистрация успешна! Проверьте почту для активации аккаунта.",
      );

      //6) Очищаем форму (необязательно, но полезно для UX)
      reset();

      //7) Редиректим на вкладку логина (логика в AuthCard) через 1.5 секунды, чтобы юзер успел прочитать сообщение
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e: any) {
      const message = e.response?.data?.message || "Ошибка при регистрации";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      {/*handleSubmit — это обертка, которая сначала проверяет данные через Zod. Если всё ок — запускает onSubmit, если есть ошибки — вызывает onFormError (показ уведомлений).*/}

      {/*Поле ввода имени:*/}
      <div className={styles.field}>
        <label>Имя</label>
        <input
          //Подключаем поле к состоянию формы (React Hook Form):
          {...register("name")}
          placeholder="Ваше имя"
          className={errors.name ? styles.inputError : ""}
        />
        {/*Используем errors.<имя поля, взятое из ...register(тут имя)>:*/}
        {errors.name && (
          <span className={styles.errorText}>{errors.name.message}</span>
        )}
      </div>

      {/*Поле ввода email:*/}
      <div className={styles.field}>
        <label>Email</label>
        <input
          {...register("email")}
          placeholder="mail@example.com"
          className={errors.email ? styles.inputError : ""}
        />
        {errors.email && (
          <span className={styles.errorText}>{errors.email.message}</span>
        )}
      </div>

      {/*Поле ввода пароля:*/}
      <div className={styles.field}>
        <label>Пароль</label>
        <div className={styles.passwordWrapper}>
          <input
            {...register("password")}
            //Меняем отображение пароля в зависимости от состояния showPassword:
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
          />
          {/*Кнопка "глаза":*/}
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword(!showPassword)}
          >
            {/*Меняем иконку в зависимости от состояния showPassword:*/}
            {showPassword ? <HiEyeOff /> : <HiEye />}
          </button>
        </div>
        {errors.password && (
          <span className={styles.errorText}>{errors.password.message}</span>
        )}
      </div>

      {/*Поле ввода пароля для подтверждения:*/}
      <div className={styles.field}>
        <label>Подтвердить пароль</label>
        <input
          {...register("confirmPassword")}
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <span className={styles.errorText}>
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      {/*Чекбокс с согласиями:*/}
      <div className={styles.checkboxField}>
        <input type="checkbox" id="terms" {...register("acceptTerms")} />
        <label htmlFor="terms">
          Я даю{" "}
          <a href="/terms" target="_blank">
            Согласие на обработку персональных данных
          </a>{" "}
          и принимаю условия{" "}
          <a href="/privacy" target="_blank">
            Политики конфиденциальности
          </a>
        </label>
        {errors.acceptTerms && (
          <span className={styles.errorText}>{errors.acceptTerms.message}</span>
        )}
      </div>

      {/*Кнопка отправки:*/}
      <button
        type="submit"
        disabled={isSubmitting} //Пока запрос идет, кнопка блокируется
        className={styles.submitBtn}
      >
        {isSubmitting ? "Регистрируемся..." : "Зарегистрироваться"}
      </button>

      {/* Кнопка сброса формы:*/}
      <button
        type="button" //Обязательно button, а не submit
        onClick={() => reset()} //При клике вызываем функцию reset()
        className={styles.resetBtn}
        disabled={isSubmitting}
      >
        Очистить форму
      </button>
    </form>
  );
};
