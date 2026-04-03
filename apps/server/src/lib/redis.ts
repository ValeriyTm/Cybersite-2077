import { Redis } from "ioredis";

//Подключаемся к Redis:
export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, //Требуется для BullMQ
});

redis.on("error", (err) => console.error("Redis Error:", err));
redis.on("connect", () => console.log("🚀 Redis Connected!"));
