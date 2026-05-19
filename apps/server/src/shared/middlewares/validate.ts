import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export const validate = (schema: ZodType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      //1.Валидируем данные запроса:
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const safeParsed = parsed as any;

      //Для отладки:
      console.log("Отладка, safeParsed: ", safeParsed);

      //2.Безопасная перезапись через дескрипторы свойств:
      if (safeParsed.query) {
        Object.defineProperty(req, "query", {
          value: safeParsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      if (safeParsed.params) {
        Object.defineProperty(req, "params", {
          value: safeParsed.params,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      if (safeParsed.body) {
        req.body = safeParsed.body;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "fail",
          errors: error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
