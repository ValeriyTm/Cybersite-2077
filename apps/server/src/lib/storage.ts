//-------Конфигурация загрузчика изображений на сервер---
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/reviews/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `review-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadReviewImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB на файл
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const mime = allowed.test(file.mimetype);
    if (mime) return cb(null, true);
    cb(new Error("Только изображения!"));
  },
}).array("images", 5); //Ограничение: максимум 5 файлов
