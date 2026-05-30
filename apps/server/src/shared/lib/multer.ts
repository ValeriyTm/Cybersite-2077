/////--------------------------------Конструктор для создания middleware на основе Multer-----------------------/////
import multer, { Field } from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { AppError } from "../utils/app-error.js";
import { NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";

interface MulterOptions {
  dest: string; //Папка, в которую будут сохраняться загружаемые файлы
  prefix?: string; //Префикс для генерируемого имени файла
  maxSizeMb?: number; //Максимальный размер файла в МБ
  maxFiles?: number; //Максимум файлов от пользователя
  allowedMimeTypes?: string[]; //Допустимые форматы файлов
  errorMsg?: string; //Сообщение, которое будет выведено юзеру при ошибке
  width?: number; //Ширина изображения
}

export const createMulter = ({
  dest,
  prefix = "",
  maxSizeMb = 2,
  maxFiles = 1,
  allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  errorMsg = "Недопустимый тип файла или слишком большой размер",
  width,
}: MulterOptions) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.mkdirSync(dest, { recursive: true }); //Не переводим на async версию, т.к. вызов происходит всего один раз - в момент инициализации приложения, а также нам нужно создать папку до того, как инициализируется объект multer и сервер начнет слушчать порт

  //Используем RAM для временного хранения:
  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
      else cb(new AppError(400, errorMsg));
    },
  });

  //Кастомный мидлвар для обработки:
  const processImages = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    if (!req.files && !req.file) return next();

    let files: Express.Multer.File[] = [];
    //Если пришли множественные файлы (объект или массив):
    if (req.files) {
      files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();
    }
    //Если пришел один файл:
    else if (req.file) {
      files = [req.file];
    }

    try {
      await Promise.all(
        files.map(async (file: Express.Multer.File) => {
          const uniqueSuffix =
            // eslint-disable-next-line
            Date.now() + "-" + Math.round(Math.random() * 1e9);

          //Проверка на то, является ли файл изображением:
          const isImage = file.mimetype.startsWith("image/");
          //Изображения конвертируем в webp, документы оставляем как есть:
          const ext = isImage ? ".webp" : path.extname(file.originalname);
          const fileName = `${prefix ? prefix + "-" : ""}${uniqueSuffix}${ext}`;
          const filePath = path.join(dest, fileName);

          if (isImage) {
            //Обработка изображений через Sharp:
            let transform = sharp(file.buffer).webp({ quality: 80 }); // Сжатие 80% без видимой потери качества
            if (width) transform = transform.resize(width);
            await transform.toFile(filePath);
          } else {
            //Сохранение документов напрямую из буфера памяти:
            //Eslint ругается, т.к. не знает, что мы формируем путь на сервере, а не на клиенте, поэтому:
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            await fs.promises.writeFile(filePath, file.buffer);
          }

          //Обновляем данные файла, чтобы контроллер знал новое имя:
          file.filename = fileName;
          file.path = filePath;
        }),
      );
      next();
    } catch (error) {
      next(new AppError(500, "Ошибка при обработке изображений"));
      logger.error("Ошибка: ", error);
    }
  };

  return {
    // Теперь возвращаем объект с методами и мидлваром обработки
    single: (name: string) => [upload.single(name), processImages],
    array: (name: string, max?: number) => [
      upload.array(name, max),
      processImages,
    ],
    fields: (fields: Field[]) => [upload.fields(fields), processImages],
  };
};
