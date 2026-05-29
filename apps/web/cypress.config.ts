import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", //Порт фронтенда
    viewportWidth: 1920,
    viewportHeight: 1080,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setupNodeEvents(_on, _config) {
      // здесь будут плагины
    },
  },
});
