import { createMulter } from "../../shared/lib/multer.js";

export const supportUpload = createMulter({
  dest: "uploads/support",
  prefix: "ticket",
  maxSizeMb: 10,
  maxFiles: 5,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  errorMsg: "Недопустимый тип файла. Разрешены: JPG, PNG, PDF, TXT, DOC/DOCX",
});
