import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    env: {
      LOKI_URL: "http://loki:3100",
    },
  },
});
