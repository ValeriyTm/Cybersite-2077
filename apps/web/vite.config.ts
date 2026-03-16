import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//Для работы алиасов:
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  //Для работы алиасов:
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
