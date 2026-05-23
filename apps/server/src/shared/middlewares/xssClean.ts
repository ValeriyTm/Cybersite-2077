//-------Тут описываем middleware для санитизации входящих данных при помощи библиотеки DOMPurify.
//--Это middleware защищает сервер от XSS-атак, удаляя любой HTML-код из входящих данных (req.body).
//Сама библиотека:
import createDOMPurify from "dompurify";
//Эмулятор браузерного окружения (DOM), так как DOMPurify изначально создан для работы в браузере^
import { JSDOM } from "jsdom";
//Типы:
import { Request, Response, NextFunction } from "express";

//Создание виртуального окна браузера:
const window = new JSDOM("").window;
//Инициализация очистителя, привязанного к виртуальному окну:
const DOMPurify = createDOMPurify(window as any);

//Рекурсивная функция для глубокой очистки объектов и массивов:
const sanitizeValue = (value: any): any => {
  //1. Если это строка — очищаем её через DOMPurify:
  if (typeof value === "string") {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  //2. Если это массив — рекурсивно очищаем каждый элемент:
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  //3. Если это объект (и не null) — рекурсивно очищаем его свойства:
  if (typeof value === "object" && value !== null) {
    const sanitizedObj: Record<string, any> = {};

    Object.keys(value).forEach((key) => {
      if (key === "__proto__" || key === "constructor") {
        return;
      }

      //Отключаем на следующей стоке линтер, т.к. он не распознает, что у нас уже добавлена защита
      // eslint-disable-next-line
      sanitizedObj[key] = sanitizeValue(value[key]);
    });

    return sanitizedObj;
  }

  //4. Для всех остальных типов (number, boolean и т.д.) возвращаем как есть:
  return value;
};

export const xssClean = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
