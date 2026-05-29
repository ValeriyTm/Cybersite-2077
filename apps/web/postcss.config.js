import postcssPxToRem from "postcss-pxtorem";
import postcssPresetEnv from "postcss-preset-env";

export default {
  plugins: [
    postcssPxToRem({
      propList: ["*"],
      mediaQuery: true,
      rootValue: 16,
      //По умолчанию в браузерах базовый шрифт равен 16px
    }),
    postcssPresetEnv({
      stage: 3,
      features: {
        "nesting-rules": true,
      },
    }),
  ],
};
