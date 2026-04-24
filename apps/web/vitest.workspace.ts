import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "unit",
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      alias: {
        "@": "./src",
      },
    },
  },
  {
    test: {
      name: "storybook",
      browser: {
        enabled: true,
        headless: true,
        name: "chromium",
      },
      alias: {
        "@": "./src",
      },
    },
  },
]);
