import axios from "axios";
import { useAuth } from "@/features/auth/model/auth-store"; //Импорт Zustand-храналища с данными о пользователе и токене

//Создание кастомного экземпляра Axios с базовыми настройками:
export const $api = axios.create({
  baseURL: "http://localhost:3001/api", //Основной адрес сервера
  withCredentials: true, //Разрешаем передачу кук, т.к. используем refreshToken
});

export const API_URL = "http://localhost:3001";

$api.interceptors.request.use((config) => {
  //Получаем Access токен из хранилища:
  const token = useAuth.getState().accessToken;
  // Добавляем токен к каждому запросу:
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка 401 (Реализуем Auto-refresh)
$api.interceptors.response.use(
  //Если запрос прошел успешно (код 2xx), просто возвращаем ответ дальше:
  (config) => config,
  //Обработка ошибок:
  async (error) => {
    //Сохранение данных изначального запроса, чтобы повторить его позже:
    const originalRequest = error.config;

    //Если сервер вернул 401 и мы еще не пытались обновить токен для этого запроса:
    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true; //Помечаем запрос, чтобы не уйти в бесконечный цикл обновлений.
      try {
        //Отправка запроса на эндпоинт /refresh для получения новой пары токенов:
        const resp = await axios.get(
          "http://localhost:3001/api/identity/auth/refresh",
          { withCredentials: true },
          //Используется стандартный axios, а не $api, чтобы избежать зацикливания.
        );

        //Сохранение нового токена и данных пользователя в глобальный стейт:
        useAuth.getState().setAuth(resp.data.user, resp.data.accessToken);
        //Повторный запуск изначального запроса, но теперь уже с новым токеном:
        return $api.request(originalRequest);
      } catch (e) {
        //Если обновить токен не удалось (например, сессия истекла совсем), принудительно разлогиниваем пользователя:
        useAuth.getState().logout();

        //[TODO] Тут добавить логику автоматического перенаправления на страницу входа при неудачном обновлении токена
      }
    }
    //Если ошибка не 401 или обновление не сработало, пробрасываем ошибку дальше в код:
    throw error;
  },
);
