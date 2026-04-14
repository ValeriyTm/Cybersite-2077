import { Redis } from "ioredis";

//Подключаемся к Redis:
export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6380,
  maxRetriesPerRequest: null, //Требуется для BullMQ (отключаем лимит попыток на один запрос,
  //позволяя библиотеке очередей самой управлять повторами при сбоях связи)
});

redis.on("error", (err) => console.error("Ошибка подключения к Redis:", err));
redis.on("connect", () => console.log("✅Redis подключен успешно"));
