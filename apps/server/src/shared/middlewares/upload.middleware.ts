import multer from "multer";
import path from "node:path";
import { AppError } from "../utils/app-error.js";

// Настройка места хранения и имени файла
const storage = multer.diskStorage({
  destination: "uploads/avatars/", // Папка в корне apps/server
  filename: (req, file, cb) => {
    // Генерируем имя: timestamp-случайноечисло.расширение
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, //Ограничиваем размер в 2MB
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|webp/; //Ограничиваем принимаемые форматы:
    const extname = types.test(path.extname(file.originalname).toLowerCase());
    const mimetype = types.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new AppError(400, "Только изображения (jpeg, jpg, png, webp) до 2МБ"));
  },
});
