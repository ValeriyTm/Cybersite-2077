//-------Тут описываем middleware для санитизации входящих данных при помощи библиотеки DOMPurify.
//--Это middleware защищает сервер от XSS-атак, удаляя любой HTML-код из входящих данных (req.body).
//Сама библиотека:
import createDOMPurify from "dompurify";
//Эмулятор браузерного окружения (DOM), так как DOMPurify изначально создан для работы в браузере^
import { JSDOM } from "jsdom";
//Импорт типов TS:
import { Request, Response, NextFunction } from "express";

//Создание виртуального окна браузера:
const window = new JSDOM("").window;
//Инициализация очистителя, привязанного к виртуальному окну:
const DOMPurify = createDOMPurify(window as any);

//Создаём middleware:
export const xssClean = (req: Request, res: Response, next: NextFunction) => {
  //Проверяем есть ли в запросе тело:
  if (req.body) {
    //Запуск цикла по всем полям, пришедшим в req.body:
    for (const key in req.body) {
      //Если значение в поле является строкой, его нужно обработать:
      if (typeof req.body[key] === "string") {
        // Очищаем строку от любых HTML тегов:
        req.body[key] = DOMPurify.sanitize(req.body[key], {
          //Все HTML-теги и атрибуты превращаем в пустую строку или простой текст:
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        });
      }
    }
  }
  //Передаём управление далее:
  next();
};
