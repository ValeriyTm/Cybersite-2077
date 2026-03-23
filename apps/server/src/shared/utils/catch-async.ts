//Пишем функцию-обертку для асинхронных контроллеров Express.
//Она избавляет нас от необходимости писать try/catch в каждом обработчике.
import { Request, Response, NextFunction } from "express";

//Эта функция принимает контроллер и возвращает его же, но с невидимым .catch(next):
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

//В Express асинхронные ошибки (внутри async/await) не ловятся сервером автоматически — приложение может просто «зависнуть» или упасть. Эта обертка ловит любую ошибку в Promise и автоматически передает её в наш errorMiddleware через функцию next().

//Как это выглядит в связке с errorMiddleware и AppError:
//-Контроллер оборачиваем в catchAsync(async(req, res) => {логика})
//-В app.ts в самый конец списка middleware ставим app.use(errorMiddleware).
//-Внутри функции контроллера выбрасываем нужные ошибки через AppError.
//По итогу: если случается ошибка (база упала или мы сами сделали throw new AppError), catchAsync ловит этот «взрыв» -->  catchAsync делает next(err), что заставляет пропустть все обычные функции и иди сразу в обработчик ошибок errorMiddleware --> errorMiddleware смотрит на ошибку: если это AppError, то клиенту выводится текст и статус-код ошибки, иначе ему сообщается, что это неизвестная ошибка с кодом 500 и записываются детали в лог сервера.
