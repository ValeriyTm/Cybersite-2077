//-------------------Централизованный обработчик ошибок для сервера--
//(Он ловит все ошибки, возникшие в приложении, и решает, какой HTTP-ответ отправить клиенту)

//Типы:
import { Request, Response, NextFunction } from "express";
//Используем свой класс для выбрасывания ошибок (теперь не нужно писать console.error и res.status(500) в каждом файле):
import { AppError } from "../utils/app-error.js";
//Запись логов в Loki:
import { logger } from "../lib/logger.js";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  //Базовый контекст запроса для логирования:
  const errorContext = {
    method: req.method,
    url: req.url,
    stack: err.stack, // Стек вызовов для поиска строки с ошибкой
  };

  //Если ошибка является AppError, т.е. известна нам:
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.message}`, {
      ...errorContext,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({ message: err.message });
  }

  //Если ошибка не является AppError (например, упала база, вылетела ошибка синтаксиса или ReferenceError):
  logger.error(`Unhandled Error: ${err.message}`, errorContext);

  //Для всех неизвестных ошибок клиенту отдается стандартный статус 500 и общее сообщение (для безопасности):
  return res.status(500).json({ message: "Внутренняя ошибка сервера" });
};
