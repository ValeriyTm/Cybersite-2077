import { Redis } from "ioredis";
//Логирование:
import { logger } from "./logger.js";

//Подключаемся к Redis:
export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6380,
  maxRetriesPerRequest: null, //Требуется для BullMQ (отключаем лимит попыток на один запрос,
  //позволяя библиотеке очередей самой управлять повторами при сбоях связи)
});

redis.on("error", (err) => logger.error("Ошибка подключения к Redis:", err));
//Добавляем условие, чтобы оповещение об успешном подключении Redis не выводилось, если оно вызвано запуском скрипта, а не основного сервера (чтобы не спамило в логи):
if (!process.argv.some((arg) => arg.includes("scripts"))) {
  redis.on("connect", () => logger.info("✅Redis подключен успешно"));
}
