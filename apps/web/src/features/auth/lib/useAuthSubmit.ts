import { useNavigate } from "react-router";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from "react-hot-toast";

interface AuthSubmitOptions<T> {
  action: string; // Название действия для Google (login, register...)
  apiCall: (data: T & { captchaToken: string }) => Promise<any>; // Функция запроса
  successMessage?: string; // Текст при успехе
  redirectPath?: string; // Куда слать юзера после успеха
  onSuccess?: (response: any) => void; // Доп. действия (например, setAuth)
}

export const useAuthSubmit = <T>() => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();

  const handleAuthSubmit = async (options: AuthSubmitOptions<T>, data: T) => {
    if (!executeRecaptcha) {
      toast.error("Защита ReCaptcha еще не готова");
      return;
    }

    try {
      // 1. Получаем токен капчи
      const captchaToken = await executeRecaptcha(options.action);

      // 2. Выполняем API запрос
      const res = await options.apiCall({ ...data, captchaToken });

      // 3. Обрабатываем успех
      if (options.successMessage) toast.success(options.successMessage);
      if (options.onSuccess) options.onSuccess(res);
      if (options.redirectPath) navigate(options.redirectPath);

      return res;
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Произошла ошибка");
      throw e; // Прокидываем ошибку дальше для formState
    }
  };

  return { handleAuthSubmit };
};
