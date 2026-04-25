import { defineConfig } from "tsup";

// export default defineConfig({
//   entry: ["src/index.ts"],
//   format: ["esm"],
//   clean: true,
//   minify: true,
//   noExternal: [/^@repo/],
//   external: ["@prisma/client", "./generated"],
// });

// export default defineConfig({
//   entry: ["src/index.ts"],
//   format: ["esm"],
//   clean: true,
//   minify: true,
//   target: "node20", //  Явно указываем версию Node.js
//   platform: "node", //  Критически важно для корректной сборки
//   noExternal: [/^@repo/],
//   external: [
//     "@prisma/client",
//     "./generated",
//     "events", //  Выносим проблемный модуль наружу
//     "fs",
//     "path",
//   ],
// });

// export default defineConfig({
//   entry: ["src/index.ts"],
//   format: ["esm"],
//   clean: true,
//   bundle: false, // ОТКЛЮЧАЕМ бандлинг (сборку в один файл)
//   minify: false, // Отключи для отладки, чтобы видеть реальный код
//   target: "node20",
//   platform: "node",
//   skipNodeModulesBundle: true, // Не трогаем node_modules
// });

// export default defineConfig({
//   entry: ["src/index.ts"],
//   format: ["esm"],
//   clean: true,
//   bundle: true, // ОТКЛЮЧАЕМ бандлинг (сборку в один файл)
//   minify: false, // Отключи для отладки, чтобы видеть реальный код
//   target: "node20",
//   platform: "node",
//   noExternal: [/^@repo/],
//   external: [
//     "@prisma/client",
//     "pg",
//     "events",
//     "fs",
//     "path",
//     "@otplib/preset-default",
//     "@otplib/core",
//   ], // Внешние зависимости
//   // skipNodeModulesBundle: true, // Не трогаем node_modules
// });

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  bundle: true,
  splitting: false,
  minify: false,
  target: "node20",
  platform: "node",
  noExternal: [/^@repo/],
  external: [
    "@prisma/client",
    // "../../packages/database/generated",
    "pg",
    "express",
    "dotenv",
    "cors",
    "events",
    "path",
    "os",
    "crypto",
    "fs",
    "@otplib/preset-default",
    "@otplib/core",
  ],

  // skipNodeModulesBundle: true,
});
