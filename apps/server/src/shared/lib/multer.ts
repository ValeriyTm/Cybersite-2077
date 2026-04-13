/////--------------------------------Конструктор для создания middleware на основе Multer-----------------------/////
import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../utils/app-error.js";

interface MulterOptions {
  dest: string; //Папка, в которую будут сохраняться загружаемые файлы
  prefix?: string; //Префикс для генерируемого имени файла
  maxSizeMb?: number; //Максимальный размер файла в МБ
  maxFiles?: number; //Максимум файлов от пользователя
  allowedMimeTypes?: string[]; //Допустимые форматы файлов
  errorMsg?: string; //Сообщение, которое будет выведено юзеру при ошибке
}

export const createMulter = ({
  dest,
  prefix = "",
  maxSizeMb = 2,
  maxFiles = 1,
  allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  errorMsg = "Недопустимый тип файла или слишком большой размер",
}: MulterOptions) => {
  // Автоматическое создание папки, если её нет
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  //Настройки хранилища:
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      //Генерируем уникальный суффикс для имени файла: "timestamp-случайное_число":
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      //Полное имя файла получается из префикса (его указываем параметром) и суффикса ("${prefix}-${suffix}-${оригинальное имя и расширение файла}"):
      const fileName = prefix ? `${prefix}-${uniqueSuffix}` : uniqueSuffix;
      cb(null, `${fileName}${path.extname(file.originalname)}`);
    },
  });

  return multer({
    storage,
    //Передаём дополнительные параметры (ограничения и фильтрация):
    limits: {
      fileSize: maxSizeMb * 1024 * 1024,
      files: maxFiles,
    },
    fileFilter: (req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        //Если формат не подходит, вызывается ошибка 400, которая затем попадет в errorMiddleware:
        cb(new AppError(400, errorMsg) as any);
      }
    },
  });
};
