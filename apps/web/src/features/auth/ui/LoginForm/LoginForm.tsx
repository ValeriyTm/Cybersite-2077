import { useState } from "react";
//React Hook Form:
import { useForm, type SubmitHandler } from "react-hook-form";
//Роутер:
import { useNavigate } from "react-router";
//Библиотека для всплывающих уведомлений:
import { toast } from "react-hot-toast";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//Схемы валидации Zod:
import { LoginSchema, type LoginInput } from "@repo/validation";
//Экземпляр axios:
import { $api } from "@/shared/api/api";
//Клиентское хранилище:
import { useAuthStore } from "@/features/auth/model/useAuthStore";
//Компоненты:
import { PasswordField } from "@/shared/ui/PasswordField";
import { Button } from "@/shared/ui/Button";
import { TwoFactorVerifyForm } from "../TwoFactorVerifyForm";
//Кастомные хуки:
import { useAuthSubmit } from "@/features/auth/lib/useAuthSubmit";
//Стили:
import styles from "../AuthCard/AuthCard.module.scss";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useOrderStore } from "@/entities/ordering/model/orderStore";

interface Props {
  onSuccess: () => void;
  onVerify2FA?: () => void;
}

export const LoginForm = ({ onSuccess, onVerify2FA }: Props) => {
  const navigate = useNavigate();

  //С клиентского стора:
  const { setAuth, tempUserId: storeId, setTempUserId } = useAuthStore();

  const { handleAuthSubmit } = useAuthSubmit<LoginInput>();

  //Локальные:
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);

  const { fetchCart, fetchFavoritesIds } = useTradingStore();
  const { fetchActiveCount } = useOrderStore();

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

            setLocalUserId(id); // Для мгновенного показа
            setTempUserId(id); // Для истории в сторе
            setShow2FA(true); // Переключаем интерфейс на ввод кода (устанавливаем переменную необходимости показа окна 2FA как true)

            toast.success("Введите 6-значный код из приложения");
            return; // Прерываем выполнение, чтобы далее не срабатывал основной вход (именно этот обработчик)
          }

          // Если 2FA не нужна — просто логинимся:
          if (res.data.accessToken) {
            setAuth(res.data.accessToken); //Устанавливаем access token в клиентский store.
            toast.success("С возвращением!");
            navigate("/profile");
          }

          //Сразу подтягиваем данные о корзине, избранном и заказах:
          fetchCart(); //Данные о корзине
          fetchActiveCount(); //Данные о активных заказах
          fetchFavoritesIds();
        },
      },
      data,
    );
  };

  //Если для пользователя включена 2FA, то показываем только поле для 6-значного кода (окно 2FA):
  if (show2FA) {
    return (
      <TwoFactorVerifyForm
        userId={localUserId}
        onSuccess={onVerify2FA || onSuccess} // Если 2FA успешно — вызываем колбэк
      />
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
