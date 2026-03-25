// apps/web/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    alias: {
      // Это должно указывать на твой src
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
