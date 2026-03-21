import axios from "axios";
import { useAuthStore } from "@/features/auth/model/auth-store"; //Импорт Zustand-храналища с данными о пользователе и токене
import createAuthRefreshInterceptor from "axios-auth-refresh";

export const API_URL = "http://localhost:3001";

//Создание кастомного экземпляра Axios с базовыми настройками:
export const $api = axios.create({
  baseURL: `${API_URL}/api/`, //Основной адрес сервера
  withCredentials: true, //Разрешаем передачу кук, т.к. используем refreshToken
});

//Интерцептор для добавления Access Token к каждому запросу:
$api.interceptors.request.use((config) => {
  //Получаем Access токен из хранилища:
  const token = useAuthStore.getState().accessToken;
  // Добавляем токен к каждому запросу:
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибки 401 (Реализуем Auto-refresh):
const refreshAuthLogic = (failedRequest: any) => {
  const url = failedRequest.response.config.url;

  // 1. ПРЕРЫВАНИЕ ЦИКЛА:
  // Если ошибка 401 пришла от САМОГО запроса на рефреш — не пытаемся обновиться снова
  if (failedRequest.response.config.url.includes("/identity/auth/refresh")) {
    return Promise.reject(failedRequest);
  }

  // 2. ИСКЛЮЧЕНИЯ ДЛЯ ПУБЛИЧНЫХ ФОРМ (добавляем сюда):
  // Чтобы при неверном пароле не вылетало "Сессия не найдена"
  if (
    url.includes("/identity/auth/login") ||
    url.includes("/identity/auth/reset-password") ||
    url.includes("/identity/auth/forgot-password")
  ) {
    return Promise.reject(failedRequest);
  }

  //3.Логика обновления:
  return axios
    .get(`${API_URL}/api/identity/auth/refresh`, { withCredentials: true })
    .then((tokenRefreshResponse) => {
      const { user, accessToken } = tokenRefreshResponse.data;

      // Обновляем Store
      useAuthStore.getState().setAuth(user, accessToken);

      // Обновляем заголовок в упавшем запросе
      failedRequest.response.config.headers["Authorization"] =
        `Bearer ${accessToken}`;

      return Promise.resolve();
    })
    .catch((err) => {
      // 2. БЕЗОПАСНАЯ ОЧИСТКА:
      // Если рефреш не удался, мы просто чистим стейт.
      // Не вызывай тут logout(), если в нем прописан запрос на сервер ($api.post('/logout')),
      // иначе получишь еще один круг 401 ошибок.
      useAuthStore.getState().setAuth(null, "");
      return Promise.reject(err);
    });
};

//Инициализируем библиотеку
createAuthRefreshInterceptor($api, refreshAuthLogic, {
  statusCodes: [401], // На какие коды реагировать
  pauseInstanceWhileRefreshing: true, // ВАЖНО: останавливает другие запросы, пока идет Refresh
});
