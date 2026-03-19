import axios from "axios";
import { useAuth } from "@/features/auth/model/auth-store"; //Импорт Zustand-храналища с данными о пользователе и токене
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
  const token = useAuth.getState().accessToken;
  // Добавляем токен к каждому запросу:
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибки 401 (Реализуем Auto-refresh):
const refreshAuthLogic = (failedRequest: any) => {
  // 1. ПРЕРЫВАНИЕ ЦИКЛА:
  // Если ошибка 401 пришла от САМОГО запроса на рефреш — не пытаемся обновиться снова
  if (failedRequest.response.config.url.includes("/identity/auth/refresh")) {
    return Promise.reject(failedRequest);
  }

  return axios
    .get(`${API_URL}/api/identity/auth/refresh`, { withCredentials: true })
    .then((tokenRefreshResponse) => {
      const { user, accessToken } = tokenRefreshResponse.data;

      // Обновляем Store
      useAuth.getState().setAuth(user, accessToken);

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
      useAuth.getState().setAuth(null, "");
      return Promise.reject(err);
    });
};

//Инициализируем библиотеку
createAuthRefreshInterceptor($api, refreshAuthLogic, {
  statusCodes: [401], // На какие коды реагировать
  pauseInstanceWhileRefreshing: true, // ВАЖНО: останавливает другие запросы, пока идет Refresh
});
////////////////

// $api.interceptors.response.use(
//   //Если запрос прошел успешно (код 2xx), просто возвращаем ответ дальше:
//   (config) => config,
//   //Обработка ошибок:
//   async (error) => {
//     //Сохранение данных изначального запроса, чтобы повторить его позже:
//     const originalRequest = error.config;

//     //Если ошибка 401 случилась при запросе /refresh,
//     //значит сессия реально мертва, и мы не пытаемся её обновлять:
//     if (
//       error.response?.status === 401 &&
//       originalRequest.url.includes("/refresh")
//     ) {
//       // Просто чистим стор БЕЗ запроса к API (чтобы не зациклиться)
//       useAuth.getState().setAuth(null, "");
//       useAuth.setState({ isAuth: false });
//       return Promise.reject(error);
//     }

//     //Если сервер вернул 401 и мы еще не пытались обновить токен для этого запроса:
//     if (error.response?.status === 401 && !originalRequest._isRetry) {
//       originalRequest._isRetry = true; //Помечаем запрос, чтобы не уйти в бесконечный цикл обновлений.
//       try {
//         //Отправка запроса на эндпоинт /refresh для получения новой пары токенов:
//         const resp = await axios.get(
//           "http://localhost:3001/api/identity/auth/refresh",
//           { withCredentials: true },
//           //Используется стандартный axios, а не $api, чтобы избежать зацикливания.
//         );

//         //Сохранение нового токена и данных пользователя в глобальный стейт:
//         useAuth.getState().setAuth(resp.data.user, resp.data.accessToken);
//         //Повторный запуск изначального запроса, но теперь уже с новым токеном:
//         return $api.request(originalRequest);
//       } catch (e) {
//         // Если рефреш не удался (например, кука удалена),
//         // просто сбрасываем состояние, не дергая logout на бэкенде
//         useAuth.getState().setAuth(null, "");
//         useAuth.setState({ isAuth: false });
//         throw e;

//         //[TODO] Тут добавить логику автоматического перенаправления на страницу входа при неудачном обновлении токена
//       }
//     }
//     //Если ошибка не 401 или обновление не сработало, пробрасываем ошибку дальше в код:
//     throw error;
//   },
// );
