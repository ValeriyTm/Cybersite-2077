import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom", // Чтобы тестировать и логику, и компоненты
    alias: {
      "@repo/validation": path.resolve(__dirname, "./packages/validation/src"),
      "@repo/types": path.resolve(__dirname, "./packages/types/src"),
    },
  },
});
