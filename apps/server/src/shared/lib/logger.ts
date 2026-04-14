import winston from "winston";
import LokiTransport from "winston-loki";

export const logger = winston.createLogger({
  transports: [
    // 1. Оставляем логи в консоли VS Code для удобства
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    // 2. Настраиваем отправку в Loki
    new LokiTransport({
      //   host: "http://host.docker.internal:3100",
      host: "http://127.0.0.1:3100",
      labels: { app: "cybersite-backend", env: "development" },
      json: true,
      format: winston.format.json(),
      // Чтобы логи не терялись при кратковременных обрывах связи
      onConnectionError: (err) => console.error("Loki Connection Error:", err),
    }),
  ],
});
