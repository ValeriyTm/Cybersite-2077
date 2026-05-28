import { createMulter } from "../../shared/lib/multer.js";

export const productUpload = createMulter({
  dest: "uploads/motorcycles",
  maxSizeMb: 5,
  maxFiles: 10,
});

export const newsUpload = createMulter({
  dest: "uploads/news",
  maxSizeMb: 5,
  maxFiles: 10,
});
