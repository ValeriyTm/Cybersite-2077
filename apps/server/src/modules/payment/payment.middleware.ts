import { Request, Response, NextFunction } from "express";
import ipRangeCheck from "ip-range-check";

export const ipFilterMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Извлекаем IP. Если мы за ngrok или другим прокси, берем x-forwarded-for
  const xForwardedFor = req.headers["x-forwarded-for"];
  const requesterIp = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : xForwardedFor?.split(",")[0] || req.socket.remoteAddress || "";

  // Очищаем IP от лишних префиксов (например, ::ffff: в IPv4)
  const cleanIp = requesterIp.replace(/^.*:/, "");

  // 2. В режиме разработки разрешаем локальные запросы для тестов через Postman
  if (
    process.env.NODE_ENV === "development" &&
    (cleanIp === "127.0.0.1" || cleanIp === "localhost")
  ) {
    console.log("⚠️ [Webhook] Пропущен локальный запрос (Dev Mode)");
    return next();
  }

  // 3. Проверка соответствия IP диапазонам ЮKassa
  const allowedIps = process.env.YOOKASSA_IPS
    ? process.env.YOOKASSA_IPS.split(",")
    : []; // Превращаем строку из .env в реальный массив
  const isAllowed = ipRangeCheck(cleanIp, allowedIps);

  if (!isAllowed) {
    console.warn(
      `🚨 [Webhook] Попытка несанкционированного доступа с IP: ${cleanIp}`,
    );
    return res.status(403).json({
      message: "Forbidden: IP not allowed",
      ip: cleanIp,
    });
  }

  console.log(
    `✅ [Webhook] Получен доверенный запрос от ЮKassa (IP: ${cleanIp})`,
  );
  next();
};
