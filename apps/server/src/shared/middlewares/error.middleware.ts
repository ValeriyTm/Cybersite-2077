//-------------------Централизованный обработчик ошибок для сервера--
//(Он ловит все ошибки, возникшие в приложении, и решает, какой HTTP-ответ отправить клиенту)
import { Request, Response, NextFunction } from "express";

//Используем свой класс для выбрасывания ошибок:
//(Теперь не нужно писать console.error и res.status(500) в каждом файле).
import { AppError } from "../utils/app-error.js";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //Если ошибка является AppError, т.е. известна нам:
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  //Если ошибка не является AppError (например, упала база, вылетела ошибка синтаксиса или ReferenceError), мы записываем ее в консоль сервера для отладки:
  console.error("🐞 Необработанная ошибка:", err);
  //Для всех неизвестных ошибок клиенту отдается стандартный статус 500 и общее сообщение (для безопасности):
  return res.status(500).json({ message: "Внутренняя ошибка сервера" });
};
