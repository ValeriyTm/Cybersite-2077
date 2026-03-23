////--------------------Настройка кода для загрузки файлов на сервер--
//Библиотека для загрузки файлов на сервер:
import multer from "multer";
import path from "node:path";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../utils/app-error.js";

////Настройка места хранения и имени файла:
//Указываем, что файлы нужно сохранять прямо на жесткий диск сервера:
const storage = multer.diskStorage({
  destination: "uploads/avatars/", //Папка в корне apps/server
  //Функция для генерации уникального имени файла:
  filename: (req, file, cb) => {
    //Генерируем уникальный для начала имени файла: "timestamp-случайное_число":
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    //Финальное имя будет выглядеть как "avatar-${suffix}-${оригинальное имя и расширение файла}":
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

////Настройка ограничений и фильтрации:
export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, //Ограничиваем размер в 2MB
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|webp/; //Ограничиваем принимаемые форматы:
    //Проверяются и расширение файла, и его реальный тип (MIME), чтобы пользователь не обманул систему:
    const extname = types.test(path.extname(file.originalname).toLowerCase());
    const mimetype = types.test(file.mimetype);

    //Если проверки пройдены, файл принимается:
    if (extname && mimetype) {
      return cb(null, true);
    }
    //Если формат не подходит, вызывается ваша ошибка 400, которая затем попадет в errorMiddleware:
    cb(new AppError(400, "Только изображения (jpeg, jpg, png, webp) до 2МБ"));
  },
});
