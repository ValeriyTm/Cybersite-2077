import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import fs from "fs/promises";
//Логирование:
import { logger } from "../lib/logger.js";

interface ValidationResult {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export const validate = (schema: ZodType<ValidationResult>) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): Promise<void> => {
    try {
      //Для отладки:
      // logger.debug("Отладка, req.body: ", req.body);
      // logger.debug("Отладка, req.query: ", req.query);
      // logger.debug("Отладка, req.params: ", req.params);

      //1.Валидируем данные запроса:
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      //Для отладки:
      // logger.debug("Отвалидированные данные, parsed: ", parsed);

      //2.Безопасная перезапись через дескрипторы свойств:
      if (parsed.query) {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      if (parsed.params) {
        Object.defineProperty(req, "params", {
          value: parsed.params,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      //Приводим req.body к валидному виду (теперь там только то, что пропустил Zod):
      if (parsed.body) {
        req.body = parsed.body;
      }

      next();
    } catch (error) {
      //1) Если валидация провалилась, а файлы уже на диске — удаляем их
      if (req.files || req.file) {
        let files: Express.Multer.File[] = [];
        if (req.files) {
          files = Array.isArray(req.files)
            ? req.files
            : Object.values(req.files).flat();
        } else if (req.file) {
          files = [req.file];
        }

        const deletePromises = files
          // Отфильтруем только те файлы, которые уже успели записаться на диск (имеют path)
          .filter((file) => file && file.path)
          .map((file) =>
            //Eslint ругается, т.к. не знает, что мы формируем путь на сервере, а не на клиенте, поэтому:
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            fs
              .unlink(file.path)
              .catch((err) =>
                logger.error(
                  `Ошибка удаления временного файла: ${file.path}`,
                  err,
                ),
              ),
          );

        await Promise.all(deletePromises);
      }

      //2) Формируем вид ответа:
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
