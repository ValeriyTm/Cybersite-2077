import storybook from "eslint-plugin-storybook";
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import cypress from "eslint-plugin-cypress";
//Плагины безопасности:
import sonarjs from "eslint-plugin-sonarjs"; //Помогает находить сложные логические дыры, которые могут стать лазейками для взлома
import noUnsanitized from "eslint-plugin-no-unsanitized"; //Для предотвращения XSS-атак (инъекций в DOM)

//Для работы с абсолютными путями в ESLint, нужно указать __dirname и __filename,
//так как в модулях ES эти переменные не определены по умолчанию:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Задаём массив настроек:
export default tseslint.config(
  {
    //Игнорируем папку сборки, чтобы ESLint не проверял сгенерированные файлы:
    ignores: ["dist"],
  }, //Включаем базовые конфигурации для JavaScript и TypeScript, а также регистрируем правила для React Hooks и React Refresh:
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended, //Конфигурация SonarJS
  {
    files: ["**/*.{ts,tsx}"], // Применять эти правила только к TS и React файлам
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      cypress: cypress,
      "no-unsanitized": noUnsanitized, //Плагин No-Unsanitized
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser, // Разрешает использование 'window', 'document' и т.д.
        ...cypress.environments.globals, //Добавляем глобальные переменные cy, it, describe
      },
      parserOptions: {
        tsconfigRootDir: __dirname, // Устанавливает корневой каталог для поиска tsconfig
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
      },
    },
    //Тут активируем конкретные проверки для React Hooks и React Refresh, а также разрешаем экспорт констант в правилах React Refresh:
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      ...noUnsanitized.configs.DOM.rules, //Активируем правила No-Unsanitized
    },
  }, //Строка для устранения конфликтов с Prettier (всегда последняя):
  eslintConfigPrettier,
  storybook.configs["flat/recommended"],
);
