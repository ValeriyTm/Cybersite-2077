import { useState } from "react";
//React Hook Form:
import { useForm } from "react-hook-form";
//Библиотека для связывания Zod и React Hook Form:
import { zodResolver } from "@hookform/resolvers/zod";
//React Query:
import { useQueryClient } from "@tanstack/react-query";
//Тип для возвращаемого значения%
import { type IUser } from "@repo/types";
//Схемы валидации Zod:
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from "@repo/validation";
//Серверное хранилище:
import { useProfile } from "@/features/auth/model/useProfile";
//Экземпляр axios и URL сервера:
import { $api, API_URL } from "@/shared/api/api";
//Библиотека для всплывающих уведомлений:
import { toast } from "react-hot-toast";

export const useProfileActions = (user: IUser | null | undefined) => {
  //Почему добавил типы null и undefined - Zod/Prisma любят null, а React Query возвращает undefined, пока данные загружаются.
  const queryClient = useQueryClient();
  const { logout } = useProfile();
  //--------------Состояния-----------------------
  //Стейт для состояния того, редактируется ли сейчас форма или нет:
  const [isEditing, setIsEditing] = useState(false);
  //Стейт для загрузки аватара:
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  //Для удаления аккаунта:
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  //Для 2FA:
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  //----------------Инициализация форм------------
  ////Основная форма профиля:
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    values: {
      name: user?.name || "",
      phone: user?.phone || "",
      gender: user?.gender || null,
      //Превращаем строку из БД в объект Date для формы:
      birthday: user?.birthday ? new Date(user.birthday) : null,
    },
  });

  ////Форма смены пароля:
  const passForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  //Достаем метод reset из этой формы (называем его resetPass для ясности)
  const { reset: resetPass } = passForm;

  ////Форма удаления аккаунта:
  const deleteForm = useForm<DeleteAccountInput>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      confirmPassword: "",
    },
  });

  //------------Helper---------
  //-------Формируем правильный путь к аватару
  //Мы можем получать аватар либо с сервера Google, либо с нашего сервера, либо вообще дефолтное изображение возтмем
  //- из-за этого будет отличаться ссылка на аватар:
  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${API_URL}${user.avatarUrl}`
    : "images/default-avatar.png";

  //-----------------Обработчики----------------
  //------Отправка формы для сохранения новых данных профиля:
  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      // Инициализируем переменную. Если пользователь не ввел дату, на сервер уйдет null:
      let formattedBirthday = null;

      //Проверяем, что в поле лежит реальный объект даты и он валиден:
      if (data.birthday instanceof Date && !isNaN(data.birthday.getTime())) {
        //Создаем копию даты, чтобы не мутировать стейт формы, т.е. чтобы изменения времени не отразились на том, что пользователь видит в инпуте прямо сейчас:
        const date = new Date(data.birthday);
        //Устанавливаем время в 12:00 дня (полдень).
        //Это гарантирует, что при любом сдвиге часового пояса (даже -11 или +12)
        //дата останется тем же числом в формате UTC:
        date.setHours(12, 0, 0, 0);
        // Превращаем дату в строку стандарта ISO, которую понимает база данных:
        formattedBirthday = date.toISOString();
      }

      //Подготавливаем данные для отправки:
      const formattedData = {
        ...data,
        //Если в поле birthday лежит объект Date, превращаем его в "YYYY-MM-DD", иначе null.
        birthday: formattedBirthday,
      };

      //Отправляем новые данные на сервер:
      await $api.patch("/identity/profile/update", formattedData);

      //Инвалидируем кэш профиля - это заставит React Query фоново перекачать актуальные данные юзера:
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      //React Query тут же сам сделает фоновый запрос на сервер, чтобы получить обновленный объект пользователя и обновить UI во всем приложении.

      toast.success("Профиль обновлен");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка обновления");
    }
  };

  //Функция-обработчик ошибок валидации:
  const onFormError = (formErrors: any) => {
    //formErrors - объект со всеми ошибками полей, которые нашел Zod.
    console.log("Ошибки валидации:", formErrors); //Убрать перед продакшеном

    //Берем первую ошибку из списка:
    const fieldError = Object.values(formErrors)[0] as any;
    //Проверяем, есть ли у найденной ошибки текст сообщения:
    if (fieldError?.message) {
      toast.error(fieldError.message, { id: "validation-error" });
    }
  };

  //-----Загрузка аватара в профиле:
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    //Достаем первый файл из массива выбранных файлов инпута.
    const file = e.target.files?.[0]; //Оператор ?. страхует от ошибки, если массив пуст.
    if (!file) return; //Если пользователь открыл окно выбора, но ничего не выбрал и нажал «Отмена», просто выходим из функции.

    //Создаем специальный объект FormData, который необходим для отправки бинарных данных (файлов) через HTTP, так как обычный JSON файлы передавать не умеет:
    const formData = new FormData();
    //Добавляем файл в объект под ключом "avatar" (именно этот ключ (avatar) должен ожидать multer на бэкенде):
    formData.append("avatar", file);

    try {
      //Включаем лоадер:
      setIsAvatarLoading(true);

      //Послыаем данные на сервер:
      await $api.post("/identity/profile/avatar", formData);

      //Инвалидируем кэш профиля, чтобы получить самые актуальные данные:
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Аватар обновлен");
      //Выходим из режима редактирования:
      setIsEditing(false);
    } catch (e) {
      toast.error("Ошибка загрузки файла");
    } finally {
      //Выключаем лоадер:
      setIsAvatarLoading(false);
    }
  };

  //--------Для смены пароля:
  const onChangePassword = async (data: ChangePasswordInput) => {
    try {
      await $api.post("/identity/auth/change-password", data);
      toast.success("Пароль успешно изменен");
      resetPass(); // Очищаем поля после успеха
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка при смене пароля");
    }
  };

  // -------Для удаления аккаунта:
  const onDeleteAccount = async (data: DeleteAccountInput) => {
    try {
      await $api.delete("/identity/auth/delete-account", {
        data: { password: data.confirmPassword },
      });

      toast.success("Ваш аккаунт удален");

      await logout(); // Очищаем серверный стор и уходим на главную
      //Используем logout() из нашего хука useProfile.
      //Он сделает запрос на бэкенд, очистит Zustand и целиком сотрет кэш React Query,
      //чтобы данные удаленного юзера не "зависли" в памяти браузера.
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка при удалении");
    }
  };

  //------Для 2FA:
  //Шаг 1: Запрос QR-кода
  const handleSetup2FA = async () => {
    try {
      //Отправляем запрос на сервер за QR-кодом:
      const res = await $api.post("/identity/auth/2fa/setup");
      //Записываем полученный url QR-кода в локальный стейт:
      setQrCode(res.data.qrCodeUrl);
    } catch (e) {
      toast.error("Ошибка при генерации QR-кода");
    }
  };

  //Шаг 2: Подтверждение кода из приложения
  const handleEnable2FA = async () => {
    try {
      //Отправляем наш код подтверждения на сервер:
      await $api.post("/identity/auth/2fa/enable", { code: verificationCode });
      toast.success("2FA успешно включена!");
      //Обнулить ссылку на QR-код и код подтверждения в нашем локальном стейте:
      setQrCode(null);
      setVerificationCode("");

      //  Инвалидируем запрос профиля. React Query сам перекачает данные юзера,
      // и поле is2FAEnabled: true мгновенно обновит интерфейс (кнопка станет неактивной).
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Неверный код");
    }
  };

  //----------------------------
  return {
    //Состояния:
    isEditing,
    setIsEditing,
    showDeleteModal,
    setShowDeleteModal,
    qrCode,
    setQrCode,
    verificationCode,
    setVerificationCode,
    //Возвращаем формы целиком:
    profileForm,
    passForm,
    deleteForm,
    //Обработчики:
    onSubmit,
    onFormError,
    handleAvatarChange,
    onChangePassword,
    onDeleteAccount,
    handleSetup2FA,
    handleEnable2FA,
    isAvatarLoading,
    //Хелперы:
    avatarSrc,
  };
};
