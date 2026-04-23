//Библиотека axios для HTTP-запросов:
import axios from "axios";
//Библиотека axios-auth-refresh для того, чтобы ставить в очередь кучу одновременных refresh-запросов к серверу:
import createAuthRefreshInterceptor from "axios-auth-refresh";
//Данные о пользователе и токене:
import { useAuthStore } from "@/features/auth";

//Адрес сервера:
export const API_URL = "http://localhost"; //Заменяю порт 3001 на 80-й для Nginx

//Создание кастомного экземпляра Axios с базовыми настройками:
export const $api = axios.create({
  baseURL: `${API_URL}/api/`, //Основной адрес сервера
  withCredentials: true, //Заставляем организовать передачу кук, т.к. используем refreshToken
});

//Использую API_URL для работы с документами, изображениями и сторонними сервисами, а $api - для всех остальных сетевых запросов

//Интерцептор для добавления Access Token к каждому запросу [REQUEST]:
$api.interceptors.request.use((config) => {
  //Получаем Access токен из клиентского хранилища:
  const token = useAuthStore.getState().accessToken;
  //Добавляем токен к каждому запросу в заголовок Authorization:
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//Обработка ошибки 401:
const refreshAuthLogic = (failedRequest: any) => {
  const url = failedRequest.response.config.url;

  //1) Защита от бесконечного цикла:
  //Если сам запрос на обновление токена упал с 401, мы не пытаемся обновиться еще раз, а прекращаем:
  if (failedRequest.response.config.url.includes("/identity/auth/refresh")) {
    return Promise.reject(failedRequest);
  }

  //2) Исключения для публичных форм:
  //(если ошибка 401 пришла при попытке входа (неверный пароль), мы не должны запускать обновление токена, так как его еще просто нет)
  if (
    url.includes("/identity/auth/login") ||
    url.includes("/identity/auth/reset-password") ||
    url.includes("/identity/auth/forgot-password")
  ) {
    return Promise.reject(failedRequest);
  }

  //3) Логика обновления:
  return (
    axios
      //Обращаемся к refresh-эндпоинту:
      .get(`${API_URL}/api/identity/auth/refresh`, { withCredentials: true })
      .then((tokenRefreshResponse) => {
        //Извлекаем данные об access token из ответа:
        const { accessToken } = tokenRefreshResponse.data;

        //Обновляем состояние в клиентском хранилище:
        useAuthStore.getState().setAuth(accessToken);

        //Берем изначальный упавший запрос (failedRequest) и вставляем в него уже новый токен:
        failedRequest.response.config.headers["Authorization"] =
          `Bearer ${accessToken}`;

        return Promise.resolve();
      })
      .catch((err) => {
        //Если обновить не удалось (сессия истекла везде), то разлогиниваем пользователя:
        useAuthStore.getState().setAuth(null);
        return Promise.reject(err);
      })
  );
};

//Инициализируем библиотеку (связываем $api с логикой обновления):
//(Реализуем Auto-refresh) [RESPONSE]
createAuthRefreshInterceptor($api, refreshAuthLogic, {
  statusCodes: [401], //На какие коды реагировать библиотеке
  pauseInstanceWhileRefreshing: true, //Останавливаем другие запросы, пока идет Refresh (если в момент истечения токена ушло 5 запросов одновременно, Axios поставит 4 из них «на паузу», выполнит 1 запрос на обновление токена, и только потом отправит остальные с новым ключом.)
});
