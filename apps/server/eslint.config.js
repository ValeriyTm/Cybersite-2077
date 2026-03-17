import js from "@eslint/js"; // Подключаем официальные правила самого ESLint
import globals from "globals"; //Огромный список стандартных переменных для разных сред (браузер, Node.js и т.д.)
import tseslint from "typescript-eslint"; //Пакет, который позволяет ESLint работать с TypeScript, предоставляя свои правила и конфигурации для TS-кода
import eslintConfigPrettier from "eslint-config-prettier"; //Специальный «выключатель». Он отключает все правила ESLint, которые могут спорить с Prettier (пробелы, кавычки), чтобы они не дрались.
// Технические инструменты Node.js для работы с путями к файлам:
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

//Вычисляем абсолютный путь к папке сервера:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Задаём массив настроек:
export default tseslint.config(
  {
    //Игнорируем папки сборки и node_modules, чтобы ESLint не проверял сгенерированные файлы и зависимости:
    ignores: ["dist/**", "node_modules/**"],
  },
  //Включаем базовые конфигурации для JavaScript и TypeScript:
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"], // Применять эти правила только к TS файлам
    languageOptions: {
      ecmaVersion: 2024, //Разрешает использовать самые свежие фишки JavaScript (стандарт 2024 года).
      sourceType: "module", // Указываем, что используем ES-модули
      globals: {
        ...globals.node,
        // Разрешаем использование глобальных переменных, специфичных для Node.js, таких как 'process', 'Buffer' и т.д.
      },
      //Указываем линтеру, где искать tsconfig именно для этого модуля:
      parserOptions: {
        // project: "./tsconfig.json", //Указывает конкретный файл tsconfig.json
        project: true,
        tsconfigRootDir: __dirname, //Жестко привязывает поиск этого файла к папке apps/server.
      },
    },
    //Тут активируем конкретные проверки для TypeScript:
    rules: {
      //Запрещает оставлять неиспользуемые переменные, но позволяет создавать такие переменные, если их имя начинается с "_". Это удобно для случаев, когда нужно объявить переменную, но она не будет использоваться (например, для интерфейсов или типов):
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-console": "off",
      //Разрешает использовать console.log. На бэкенде это полезно для отладки, пока нет серьезного логгера.
    },
  },
  //Строка для устранения конфликтов с Prettier (всегда последняя):
  eslintConfigPrettier,
  //Он пробегается по всем правилам выше и «гасит» те, что касаются стиля
);
