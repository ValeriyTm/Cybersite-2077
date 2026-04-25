/////--------------------------------Конструктор для создания middleware на основе Multer-----------------------/////
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { AppError } from "../utils/app-error.js";

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
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  //Используем RAM для временного хранения:
  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
      else cb(new AppError(400, errorMsg) as any);
    },
  });

  //Кастомный мидлвар для обработки:
  const processImages = async (req: any, _res: any, next: any) => {
    if (!req.files && !req.file) return next();

    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : [req.file];

    try {
      await Promise.all(
        files.map(async (file: any) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          //Конвертируем всё в .webp для максимальной минификации
          const fileName = `${prefix ? prefix + "-" : ""}${uniqueSuffix}.webp`;
          const filePath = path.join(dest, fileName);

          let transform = sharp(file.buffer).webp({ quality: 80 }); // Сжатие 80% без видимой потери качества

          if (width) {
            transform = transform.resize(width); //Если указана ширина — ресайзим
          }

          await transform.toFile(filePath);

          //Обновляем данные файла, чтобы контроллер знал новое имя:
          file.filename = fileName;
          file.path = filePath;
        }),
      );
      next();
    } catch (error) {
      next(new AppError(500, "Ошибка при обработке изображений"));
    }
  };

  return {
    // Теперь возвращаем объект с методами и мидлваром обработки
    single: (name: string) => [upload.single(name), processImages],
    array: (name: string, max?: number) => [
      upload.array(name, max),
      processImages,
    ],
    fields: (fields: any) => [upload.fields(fields), processImages],
  };
};
