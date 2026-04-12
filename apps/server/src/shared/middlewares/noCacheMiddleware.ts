//Middleware, устанавливающее заголовки, запрещающие браузеру кэшировать данные
import { Request, Response, NextFunction } from "express";

export const noCacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};
