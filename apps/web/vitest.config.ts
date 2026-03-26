import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path"; /////

//Пути, которые будем использовать для алиасов:
const __dirname = path.dirname(fileURLToPath(import.meta.url)); /////
const srcPath = path.resolve(__dirname, "./src");
const storybookPath = path.resolve(__dirname, "./.storybook");

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",

    //Важно алиасы поместить не глобально, а в каждый проект отдельно:
    projects: [
      //Unit-тесты:
      {
        name: "unit",
        test: {
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          alias: {
            "@": srcPath,
          },
        },
      },
      //Тесты Storybook:
      {
        name: "storybook",
        plugins: [
          storybookTest({
            configDir: storybookPath,
          }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          alias: {
            "@": srcPath,
          },
        },
      },
    ],
  },
});
