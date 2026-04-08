//Тут настройка Express
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
//Middleware для глобальной обработки ошибок:
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
//Middleware для санитизации входящих данных при помощи библиотеки DOMPurify:
import { xssClean } from "./shared/middlewares/xss-clean.js";
//Middleware для защиты всех эндпоинтов от DDoS и brute force (Rate Limiting):
import { commonLimiter } from "./shared/middlewares/rate-limiter.js";
//Роутеры для модулей:
import { identityRouter } from "./modules/identity/identity.routes.js";
import catalogRouter from "./modules/catalog/catalog.routes.js";
import tradingRouter from "./modules/trading/trading.routes.js";
import warehouseRouter from "./modules/warehouse/warehouse.routes.js";
import orderRouter from "./modules/ordering/order.routes.js";
import reviewRouter from "./modules/reviews/review.routes.js";
import discountRouter from "./modules/discount/discount.routes.js";
import paymentRouter from "./modules/payment/payment.routes.js";
import supportRouter from "./modules/support/support.routes.js";

//Создаём экземпляр приложения Express:
const app = express();

//Настройки CORS:
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5000"],
  //Разрешаем передачу cookies, HTTP-авторизацию и TLS-сертификатов:
  credentials: true,
  //HTTP-статус, который сервер вернет в ответ на «предварительный»
  //(preflight) запрос браузера (для поддержки старых браузеров (IE11)):
  optionsSuccessStatus: 200,
};
//----------------------------------Подключаем middleware:--------
//Тут будет Morgan

//Логирование входящих данных (ставим первым, чтобы фиксировать запрос в тот момент, когда он только пришел на сервер):
app.use(morgan("combined"));
//combined - подробность выводимой инфы в логи

//Настройка заголовков безопасности. Helmet всегда должен стоять самым первым (кроме логирования):
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "data:",
          //Разрешаем загрузку аватарок с Google и своего сервера:
          "https://*.googleusercontent.com", // Используем маску для надежности
          "http://localhost:3001",
        ],

        // Запрещает использование опасных функций (DOM sinks) без специальных политик:
        "require-trusted-types-for": ["'script'"],
        // Разрешаем политику DOMPurify
        // или политики популярных библиотек:
        "trusted-types": ["default", "dompurify"],
      },
    },
  }),
);
//При использовании helmet не допускается какой-либо JS-код
//в HTML, а также использование обработчиков событий в HTML

//Настройка политики CORS (для разрешения кросс-доменных запросов):
app.use(cors(corsOptions));

//Защита всех эндпоинтов от DDoS и brute force (Rate Limiting):
app.use(commonLimiter);
//Лимитер отсекает лишние запросы по IP еще до того, как сервер начнет тратить память на парсинг JSON (express.json()) или очистку от XSS.

//Парсер тела json-запроса от клиента
//(срабатывает, если с клиента приходит нечто формата
//application/json):
app.use(express.json());

//Парсер тела отправленной с клиента формы:
//(срабатывает, если с клиента приходит нечто с
//заголовком "x-www-form-urlencoded"; например, если мы
//тестируем API через Postman, выбирая вкладку x-www-form-urlencoded вместо raw -> JSON):
app.use(express.urlencoded({ extended: true }));
//Через {extended: true} используем модуль queryString,
//не являющийся встроенным (Express сам там под капотом
//это делает). Это позволяет парсить сложные объекты и массивы из строк запроса.

//Санитайзинг входящих данных:
app.use(xssClean);

//Защита от атак типа «загрязнение параметров HTTP»:
app.use(hpp()); // Защищает и req.query, и req.body (т.к. стоит после express.json)

//Извлекаем данные из кук:
app.use(cookieParser());

//Открываем папку apps/server/uploads для раздачи по пути домен/static/:
app.use("/static", express.static("uploads"));

//Выводим в консоль данные, полученные от клиента:
// app.use((req, res, next) => {
//   console.log("Данные от пользователя:", req.body);
//   next();
// });
//----------------------------Подключаем роуты модулей:--------
//Роуты для модуля Identity:
app.use("/api/identity", identityRouter);
//Роуты для модуля Catalog:
app.use("/api/catalog", catalogRouter);
//Роуты для модуля Trading:
app.use("/api/trading", tradingRouter);
//Роуты для модуля Warehouse:
app.use("/api/warehouse", warehouseRouter);
//Роуты для модуля Ordering:
app.use("/api/orders", orderRouter);
//Роуты для модуля Reviews:
app.use("/api/reviews", reviewRouter);
//Роуты для модуля Discount:
app.use("/api/discount", discountRouter);
//Роуты для модуля Payment:
app.use("/api/payment", paymentRouter);
//Роуты для модуля Support:
app.use("/api/support", supportRouter);
//Тестовый эндпоинт для проверки работоспособности сервера (Health Check):
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

//Обработка ошибок со всего приложения (всегда ставится в конце):
app.use(errorMiddleware);

export default app;
