import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

//Пути, которые будем использовать для алиасов:
const srcPath = fileURLToPath(new URL("./src", import.meta.url));
const storybookPath = fileURLToPath(new URL("./.storybook", import.meta.url));

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
