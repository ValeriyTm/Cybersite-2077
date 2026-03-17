/** @type {import('stylelint').Config} */
//Директива выше сделает так, что VS Code будет подсвечивать ошибки прямо в редакторе и давать автодополнение по правилам

export default {
  extends: [
    //Здесь мы подключаем готовые наборы правил, чтобы не писать сотни настроек вручную. Важен порядок подключения.
    "stylelint-config-standard-scss", //Включает стандартные правила для SCSS
    "stylelint-config-clean-order", //Автоматическая сортировка свойств. Он расставляет display и position в начало, а color и font — в конец.
    "stylelint-config-prettier-scss", //Отключает все правила Stylelint, которые могут конфликтовать с Prettier. Благодаря ему Stylelint следит за логикой, а Prettier — за пробелами.
  ],
  rules: {
    // Разрешаем camelCase для CSS Modules, т.к. по умолчанию Stylelint требует kebab-case:
    "selector-class-pattern": null,
    // Игнорируем специфические для CSS Modules псевдоселекторы:
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global", "local"],
        //Стандартный CSS не знает про псевдоклассы :global и :local. Если их не «легализовать», Stylelint будет выдавать ошибку.
      },
    ],
    // Отключаем правило приоритетов (иногда мешает в CSS Modules):
    "no-descending-specificity": null,
  },
};
