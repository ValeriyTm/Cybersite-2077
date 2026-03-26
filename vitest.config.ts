import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    //Используем projects для изоляции настроек разных частей монорепозитория:
    projects: [
      //Frontend:
      {
        name: "web",
        // Указываем корень проекта для корректного поиска файлов
        root: path.resolve(__dirname, "./apps/web"),
        test: {
          // Явно ищем тесты внутри apps/web
          include: ["src/**/*.test.{ts,tsx}"],
          globals: true,
          environment: "jsdom",
          alias: {
            // ЖЕСТКАЯ ПРИВЯЗКА: теперь @ всегда ведет в apps/web/src 🎯
            "@": path.resolve(__dirname, "./apps/web/src"),
          },
        },
      },
      //Backend:
      {
        name: "server", // НОВЫЙ ПРОЕКТ ДЛЯ БЭКЕНДА 🚀
        root: path.resolve(__dirname, "./apps/server"),
        test: {
          include: ["src/**/*.test.ts"],
          globals: true,
          environment: "node",
          alias: {
            "@": path.resolve(__dirname, "./apps/server/src"),
          },
        },
      },
      //Прочие пакеты:
      {
        name: "packages",
        root: path.resolve(__dirname, "./packages"),
        test: {
          include: ["**/*.test.ts"],
          globals: true,
          environment: "node",
          alias: {
            "@repo/validation": path.resolve(
              __dirname,
              "./packages/validation/src",
            ),
            "@repo/types": path.resolve(__dirname, "./packages/types/src"),
          },
        },
      },
    ],
  },
});
