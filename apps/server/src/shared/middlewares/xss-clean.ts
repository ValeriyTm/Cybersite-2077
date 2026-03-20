import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { Request, Response, NextFunction } from "express";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as any);

export const xssClean = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        // Очищаем строку от любых HTML тегов
        req.body[key] = DOMPurify.sanitize(req.body[key], {
          ALLOWED_TAGS: [], // Запрещаем ВООБЩЕ все теги для обычных полей
          ALLOWED_ATTR: [],
        });
      }
    }
  }
  next();
};
