/** @type {import('stylelint').Config} */
//Директива выше сделает так, что VS Code будет подсвечивать ошибки прямо в редакторе и давать автодополнение по правилам

export default {
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-clean-order",
    "stylelint-config-prettier-scss",
  ],
  rules: {
    // Разрешаем camelCase для CSS Modules (если планирую его использовать)
    "selector-class-pattern": null,
    // Игнорируем специфические для CSS Modules псевдоселекторы
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global", "local"],
      },
    ],
    // Отключаем правило приоритетов (иногда мешает в CSS Modules)
    "no-descending-specificity": null,
  },
};
