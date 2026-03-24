import { useState } from "react";
//React Hook Form:
import { useForm, type SubmitHandler } from "react-hook-form";
//Библиотека для всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Схемы валидации Zod:
import { LoginSchema, type LoginInput } from "@repo/validation";
//Google reCAPTCHA v3:
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
//Экземпляр axios:
import { $api } from "@/shared/api/api";
//Клиентское хранилище:
import { useAuthStore } from "@/features/auth/model/auth-store";
//Компоненты:
import { PasswordField } from "@/shared/ui/PasswordField";
//Стили:
import styles from "../AuthCard/AuthCard.module.scss";
import { useAuthSubmit } from "@/features/auth/lib/useAuthSubmit";

export const LoginForm = () => {
  //Подключаем Google Captcha (функция executeRecaptcha будет генерировать невидимый токен проверки):
  const { executeRecaptcha } = useGoogleReCaptcha();

  //С клиентского стора:
  const { setAuth, tempUserId: storeId, setTempUserId } = useAuthStore();

  const { handleAuthSubmit } = useAuthSubmit<LoginInput>();

  //Локальные:
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
    defaultValues: {
      // Инициализируем значения по умолчанию
      email: "",
      password: "",
      rememberMe: false,
      captchaToken: "",
    },
  });

  //Отправка формы:
  const onSubmit: SubmitHandler<LoginInput> = async (data: LoginInput) => {
    //1) Ждем токен от Google.  Если сервис капчи не прогрузился, регистрация блокируется.
    if (!executeRecaptcha) {
      toast.error("Капча еще не загружена");
      return;
    }

    try {
      //2) Получаем токен действия 'login'
      const captchaToken = await executeRecaptcha("login");

      //3) Отправляем на сервер данные:
      const res = await $api.post("/identity/auth/login", {
        ...data,
        //Прикладываем токен капчи:
        captchaToken,
      });

      //4) Если бэкенд говорит, что нужен код (когда включена 2FA):
      if (res.data.requires2FA) {
        const id = res.data.userId;
        setLocalUserId(id); // Сохраняем локально (мгновенно)
        setTempUserId(id); // Сохраняем в глобальный стор (для истории)
        setShow2FA(true); //Устанавливаем переменную необходимости показа окна 2FA как true

        toast.success("Введите 6-значный код из приложения");
        return;
      }

      //5) Если 2FA не нужен, то осуществляем обычный вход:
      setAuth(res.data.accessToken); //Устанавливаем access token в клиентский store.
      toast.success("С возвращением!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка входа");
    }
  };

  //Ввод кода 2FA:
  const onVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    //1) Берем id пользователя из локального хранилища или из клиентского:
    const activeId = localUserId || storeId;

    //2) Проверки:
    if (twoFactorCode.length !== 6) return toast.error("Введите 6 цифр");

    if (!activeId) {
      console.error("ОШИБКА: ID не найден ни в сторе, ни локально");
      return toast.error("Ошибка сессии. Попробуйте войти снова.");
    }

    setIsVerifying(true); //Устанавливаем статус проверки в true

    try {
      //3) Запрос к серверу с нашим id юзера и введенным кодом:
      const res = await $api.post("/identity/auth/2fa/verify", {
        userId: activeId,
        code: twoFactorCode,
      });

      setAuth(res.data.accessToken); //Устанавливаем access token из ответа в клиентский store.
      toast.success("Личность подтверждена!");
      setLocalUserId(null); //Обнуляем локальный userId
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Неверный код");
    } finally {
      setIsVerifying(false); //Устанавливаем статус проверки в false
    }
  };

  //Если для пользователя включена 2FA, то показываем только поле для 6-значного кода (окно 2FA):
  if (show2FA) {
    return (
      <form onSubmit={onVerify2FA} className={styles.form}>
        <div className={styles.field}>
          <label>Двухфакторная аутентификация</label>
          <p className={styles.subText}>
            Введите код из Aegis / Google Authenticator
          </p>
          <input
            type="text"
            value={twoFactorCode}
            onChange={(e) =>
              setTwoFactorCode(e.target.value.replace(/\D/g, ""))
            }
            placeholder="000 000"
            maxLength={6}
            className={styles.inputCenter}
            autoFocus
          />
        </div>
        {/*Кнопка отправки кода:*/}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isVerifying}
        >
          {isVerifying ? "Проверка..." : "Войти"}
        </button>
        {/*Кнопка отмены и возврата назад:*/}
        <button
          type="button"
          onClick={() => {
            setShow2FA(false); //Убираем окно 2FA
            setLocalUserId(null); //Сброс при возврате
            setTwoFactorCode("");
          }}
          className={styles.backBtn}
        >
          Вернуться назад
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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
      <PasswordField
        label={
          <div className={styles.labelWithLink}>
            <span>Пароль</span>
            <a href="/forgot-password" className={styles.forgotLink}>
              Забыли пароль?
            </a>
          </div>
        }
        registration={register("password")}
        error={errors.password}
        placeholder="••••••••"
      />

      {/* Контейнер "Запомнить меня" */}
      <div className={styles.optionsRow}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" {...register("rememberMe")} />
          <span>Запомнить меня</span>
        </label>
      </div>

      {/*Кнопка отправки формы:*/}
      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitBtn}
      >
        {isSubmitting ? "Входим..." : "Войти"}
      </button>
    </form>
  );
};
