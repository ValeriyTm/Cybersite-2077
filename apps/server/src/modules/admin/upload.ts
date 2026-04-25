import { createMulter } from "../../shared/lib/multer.js";

export const productUpload = createMulter({
  dest: "uploads/news",
  maxSizeMb: 5,
  maxFiles: 10,
});
