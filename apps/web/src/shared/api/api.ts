//Библиотека axios для HTTP-запросов:
import axios from "axios";
//Библиотека axios-auth-refresh для того, чтобы ставить в очередь кучу одновременных refresh-запросов к серверу:
import createAuthRefreshInterceptor from "axios-auth-refresh";
//Данные о пользователе и токене:
import { useAuthStore } from "@/features/auth";

//Чистый домен сервера:
export const API_URL = import.meta.env.VITE_API_URL;

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
  const url = failedRequest.response?.config?.url || "";
  const token = useAuthStore.getState().accessToken;

  //1) Защита от бесконечного цикла рефреша:
  //Если сам запрос на обновление токена упал с 401, мы не пытаемся обновиться еще раз, а прекращаем:
  if (url.includes("/identity/auth/refresh")) {
    return Promise.reject(failedRequest);
  }

  // 2) Если упал запрос профиля, но у нас в памяти пустой токен,
  // значит рефрешить нечего, это просто неавторизованный запрос при первой загрузке.
  if (url.includes("/identity/profile/me") && !token) {
    return Promise.reject(failedRequest);
  }

  //3) Исключения для публичных форм:
  //(если ошибка 401 пришла при попытке входа (неверный пароль), мы не должны запускать обновление токена, так как его еще просто нет)
  if (
    url.includes("/identity/auth/login") ||
    url.includes("/identity/auth/reset-password") ||
    url.includes("/identity/auth/forgot-password")
  ) {
    return Promise.reject(failedRequest);
  }

  //4) Логика обновления:
  return (
    //Используем чистый axios, а не $api, т.к. не нужно прикреплять просроченный access токен
    axios
      //Обращаемся к refresh-эндпоинту:
      .post(
        `${API_URL}/api/identity/auth/refresh`, //URL
        {}, //Body
        { withCredentials: true }, //Config (настройки)
      )
      .then((tokenRefreshResponse) => {
        //Извлекаем данные об access token из ответа:
        const { accessToken } = tokenRefreshResponse.data;

        //Обновляем состояние в клиентском хранилище:
        useAuthStore.getState().setAuth(accessToken);

        //Берем изначальный упавший запрос (failedRequest) и вставляем в него уже новый токен:
        failedRequest.response.config.headers.Authorization = `Bearer ${accessToken}`;

        return Promise.resolve();
      })
      .catch((err) => {
        //Если сервер что-то ответил (например, 400, 403, 500) — это сбой сессии.
        // Если err.response нет, значит сервер оффлайн или пропал интернет.
        if (err.response) {
          useAuthStore.getState().clearAuth(); //Разлогиниваем пользователя
          if ($api.defaults.headers.common.Authorization) {
            delete $api.defaults.headers.common.Authorization; // Стираем заголовки и кэш, чтобы прервать любые зависшие запросы очереди
          }
        } else {
          // Сервер оффлайн — логируем, но clearAuth() НЕ ВЫЗЫВАЕМ!
          console.warn("🌐 Сервер бэкенда недоступен. Ожидание сети...");
        }
        return Promise.reject(err);
      })
  );
};

//Инициализируем библиотеку (связываем $api с логикой обновления):
//(Реализуем Auto-refresh) [RESPONSE]
createAuthRefreshInterceptor($api, refreshAuthLogic, {
  statusCodes: [401], //На какие коды реагировать библиотеке
});
