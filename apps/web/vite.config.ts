import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//Для работы алиасов:
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Позволяет Nginx из Docker достучаться до Vite
    port: 5173,
    strictPort: true, // Чтобы Vite не прыгнул на другой порт, если этот занят
    allowedHosts: ["host.docker.internal", "localhost", ".localhost"],
    watch: {
      usePolling: true, // Полезно для стабильного HMR при работе с Docker
    },
  },
  //Для работы алиасов:
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
