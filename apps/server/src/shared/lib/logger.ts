import winston from "winston"; //Основное ядро библиотеки Winston (собирает логи)
import LokiTransport from "winston-loki"; //Плагин (транспорт), который умеет упаковывать логи и отправлять их в Loki (на хранение) по HTTP

//Массив путей назначения (Winston может отправлять один и тот же лог в разные места одновременно):
const transports: winston.transport[] = [
  // 1. Оставляем логи в консоли IDE (для удобства):
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.errors({ stack: true }), //Чтобы писать logger.error(msg, error)
      winston.format.colorize(), //Раскрашиваем уровни логов
      winston.format.simple(), //Упрощаем формат вывода до вида уровень: сообщение
    ),
  }),
];

// 2. Настраиваем отправку на сервер Loki:
//Добавляем Loki только если передан URL:
if (process.env.LOKI_URL) {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_URL!,
      labels: { app: "cybersite-backend", env: "development" }, //Теги для фильтрации логов в Grafana
      json: true, //Указываем, что данные передаются в формате JSON
      format: winston.format.combine(
        winston.format.errors({ stack: true }), //Чтобы писать logger.error(msg, error)
        winston.format.json(),
      ), // форматируем сам текст лога как JSON-объект
      //Если сервер Loki недоступен, чтобы приложение не «падало» из-за проблем с системой логирования:
      onConnectionError: (err) => console.error("Loki Connection Error:", err),
    }),
  );
}

//Создаем экземпляр логгера с настройками:
export const logger = winston.createLogger({ transports });
