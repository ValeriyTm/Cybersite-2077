import { createMulter } from "src/shared/lib/multer.js";

export const uploadReviewImages = createMulter({
  dest: "uploads/reviews/",
  prefix: "review",
  maxSizeMb: 5,
  maxFiles: 5,
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  errorMsg: "Только изображения (jpeg, jpg, png, webp) до 5МБ",
});
