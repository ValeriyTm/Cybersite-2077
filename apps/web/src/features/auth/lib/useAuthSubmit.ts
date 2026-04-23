//Роутинг:
import { useNavigate } from "react-router";
//Google reCAPTCHA v3:
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
//Библиотека для всплывающих уведомлений:
import { toast } from "react-hot-toast";

interface AuthSubmitOptions<T> {
  action: string; // Название действия для Google (login, register...)
  apiCall: (data: T & { captchaToken: string }) => Promise<any>; // Функция запроса
  successMessage?: string; // Текст при успехе
  redirectPath?: string; // Куда слать юзера после успеха
  onSuccess?: (response: any) => void; // Доп. действия (например, setAuth)
}

export const useAuthSubmit = <T>() => {
  //Подключаем Google Captcha (функция executeRecaptcha будет генерировать невидимый токен проверки):
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();

  const handleAuthSubmit = async (options: AuthSubmitOptions<T>, data: T) => {
    //1) Ждем токен от Google.  Если сервис капчи не прогрузился, регистрация блокируется.
    if (!executeRecaptcha) {
      toast.error("Защита ReCaptcha еще не готова");
      return;
    }

    try {
      //2) Получаем токен капчи:
      const captchaToken = await executeRecaptcha(options.action);

      //3) Выполняем запрос к серверу:
      const res = await options.apiCall({ ...data, captchaToken }); ////Прикладываем данные и токен капчи:

      //4) Обрабатываем успех:
      //Выводим всплывающее уведомление:
      if (options.successMessage) toast.success(options.successMessage);
      if (options.onSuccess) options.onSuccess(res);
      //Редирект на другую страницу:
      if (options.redirectPath) navigate(options.redirectPath);

      return res;
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Произошла ошибка");
      throw e; // Прокидываем ошибку дальше для formState
    }
  };

  return { handleAuthSubmit };
};
