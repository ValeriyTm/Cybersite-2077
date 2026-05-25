//Анимация:
import { motion, useReducedMotion } from "motion/react";
import { motoVariants, smokeVariants, wheelVariants } from '../../../model/animations'
//Изображения:
import backWheelImage from '@/shared/assets/images/animation/back-wheel.png';
import frontWheelImage from '@/shared/assets/images/animation/front-wheel.png';
import smokeImage from '@/shared/assets/images/animation/smoke.png';
//Стили:
import styles from "./AnimatedMotorcycle.module.scss";

export const AnimatedMotorcycle = () => {
  const shouldReduceMotion = useReducedMotion();

  // Если у пользователя включено ограничение анимации в ОС, она не запустится
  const hoverAnimation = shouldReduceMotion ? undefined : "moving";

  return (
    <div className={styles.cell2} aria-hidden="true">
      <motion.div
        className={styles.cellContainer}
        initial="stopped"
        whileHover={hoverAnimation}
      >
        <motion.div
          className={styles.motorcycleFrame}
          variants={shouldReduceMotion ? {} : motoVariants}
        >
          <motion.img
            src={backWheelImage}
            className={styles.backWheel}
            variants={shouldReduceMotion ? {} : wheelVariants}
          />
          <motion.img
            src={frontWheelImage}
            className={styles.frontWheel}
            variants={shouldReduceMotion ? {} : wheelVariants}
          />
          <motion.img
            src={smokeImage}
            className={styles.smoke}
            variants={shouldReduceMotion ? {} : smokeVariants}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
