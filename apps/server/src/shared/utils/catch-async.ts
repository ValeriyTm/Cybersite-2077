import { Request, Response, NextFunction } from "express";

//Эта функция принимает контроллер и возвращает его же, но с невидимым .catch(next):
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
