import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
//Для работы алиасов:
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), visualizer({ open: true }) as PluginOption],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("leaflet")) {
              return "maps-vendor";
            }
            if (id.includes("@sentry")) {
              return "sentry-vendor";
            }
            if (id.includes("motion") || id.includes("swiper")) {
              return "ui-effects-vendor";
            }
            if (id.includes("@tanstack/react-query-devtools")) {
              return "devtools-vendor";
            }
            if (id.includes("lodash")) {
              return "lodash-vendor";
            }

            //Остальные бибилотеки остаются в базовом vendor:
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    host: true, // Позволяет Nginx из Docker достучаться до Vite
    port: 5173,
    strictPort: true, // Чтобы Vite не прыгнул на другой порт, если этот занят
    allowedHosts: ["host.docker.internal", "localhost", ".localhost"],
    watch: {
      usePolling: true, // Полезно для стабильного HMR при работе с Docker
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/app/styles/helpers/_media.scss" as *;`,
        // Теперь миксины доступны в любом .module.scss файле без импорта
      },
    },
  },
  //Для работы алиасов:
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
