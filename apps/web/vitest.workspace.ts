export default [
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
];
