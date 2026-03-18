import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/api-error.js";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({ message: "Внутренняя ошибка сервера" });
};

//Теперь не нужно писать console.error и res.status(500) в каждом файле.
//Всё логирование теперь тут.
