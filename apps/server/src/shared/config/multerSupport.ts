import multer from "multer";
import path from "path";
import fs from "fs";

// Папка для документов саппорта
const uploadDir = "uploads/support";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `ticket-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const supportUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Лимит 10МБ на файл
    files: 5, // Максимум 5 файлов в одном тикете
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Недопустимый тип файла. Разрешены: JPG, PNG, PDF, TXT, DOC/DOCX",
        ),
      );
    }
  },
});
