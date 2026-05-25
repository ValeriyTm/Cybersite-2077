import { type Variants } from "motion/react";

export const wheelVariants: Variants = {
  moving: {
    rotate: 360,
    transition: { repeat: Infinity, duration: 0.4, ease: "linear" },
  },
  stopped: { rotate: 0 },
};

export const motoVariants: Variants = {
  moving: {
    y: [0, -2, 0], // Легкая вибрация вверх-вниз
    transition: { repeat: Infinity, duration: 0.1 },
  },
  stopped: { y: 0 },
};

export const smokeVariants: Variants = {
  stopped: {
    opacity: 0,
    scale: 0.5,
    y: 0,
  },
  moving: {
    opacity: [0, 0.8, 0], // Появляется до 80% и снова в ноль
    scale: [0.8, 1.2], // Немного увеличивается в размере
    y: -20, // Улетает вверх на 20px
    transition: {
      duration: 1.5, // Скорость одного выхлопа газов
      repeat: Infinity, // Повторять бесконечно
      ease: "easeOut",
    },
  },
};
