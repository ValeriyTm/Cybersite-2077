import { createMulter } from "src/shared/lib/multer.js";

export const uploadAvatar = createMulter({
  dest: "uploads/avatars/",
  prefix: "avatar",
  maxSizeMb: 2,
  errorMsg: "Только изображения (jpeg, jpg, png, webp) до 2МБ",
});
