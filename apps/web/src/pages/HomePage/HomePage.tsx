//Роутер:
import { Link } from "react-router";
//Хранилища:
import { useAuthStore } from "@/features/auth/model/useAuthStore"; //Клиентское
import { useProfile } from "@/features/auth/model/useProfile"; //Серверное
import { GlobalDiscountBanner } from "@/widgets/GlobalDiscountBanner/ui/GlobalDiscountBanner";
import styles from "./HomePage.module.scss";
import { MainCarousel } from "@/widgets/MainCarousel/MainCarousel";
import { ScrollableImageGallery } from "@/widgets/ScrollableImageGallery/ScrollableImageGallery";
import { motion } from "motion/react";

export const HomePage = () => {
  //Из Zustand берем статус авторизации пользователя:
  const isAuth = useAuthStore((state) => state.isAuth);

  //Из React Query берем данные пользователя и состояние загрузки.
  //Используется isLoading, чтобы не показывать "Вы не авторизованы", пока идет запрос.
  const { user, isLoading } = useProfile();

  ///
  // 1. Создаем правила анимации
  const wheelVariants = {
    moving: {
      rotate: 360,
      transition: { repeat: Infinity, duration: 0.4, ease: "linear" },
    },
    stopped: { rotate: 0 },
  };

  const motoVariants = {
    moving: {
      y: [0, -2, 0], // Легкая вибрация вверх-вниз
      transition: { repeat: Infinity, duration: 0.1 },
    },
    stopped: { y: 0 },
  };

  const smokeVariants = {
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
        duration: 1.5, // Скорость одного "пшика" дыма
        repeat: Infinity, // Повторять бесконечно
        ease: "easeOut",
      },
    },
  };
  ///
  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>Загрузка...</div>
    );

  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
      <GlobalDiscountBanner></GlobalDiscountBanner>

      <div className={styles.mainBannerSection}>
        <div className={styles.mainBannerPartLeft}>
          <img
            src="images/banners/mainBanner.png"
            alt="Главный баннер страницы"
            className={styles.bannerImage}
          />

          {/* <button className={styles.mainBannerBtn}>Начать →</button> */}
        </div>
        <div className={styles.mainBannerPartRight}>
          <img
            className={styles.bannerImageText}
            src="images/banners/mainBannerOrangeText.png"
            alt="Главный баннер страницы"
          />
          <div className={styles.mainBannerPartRightCont}>
            <span>Начни покупки с нами</span>

            {isAuth && user ? (
              <div>
                <Link to="/catalog">
                  <button className={styles.mainBannerBtn}>Начать →</button>
                </Link>
              </div>
            ) : (
              <div>
                <Link to="/auth">
                  <button className={styles.mainBannerBtn}>Начать →</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.decoration}></div>

      <div className={styles.container}>
        <div className={styles.cell}>
          <span>Наша команда:</span>
          <img
            src="/images/banners/team.jpg"
            alt=""
            className={styles.teamImage}
          />
        </div>

        <div className={styles.cell}>
          {/* <div className={styles.cellContainer}>
            <div className={styles.motorcycleFrame}>
              <img
                src="/animation/back-wheel.png"
                alt="part of animation"
                className={`${styles.backWheel}`}
              />
              <img
                src="/animation/front-wheel.png"
                alt="part of animation"
                className={`${styles.frontWheel}`}
              />
            </div>
          </div> */}
          <motion.div
            className={styles.cellContainer}
            initial="stopped"
            whileHover="moving" // Запускает анимацию у всех motion-детей
          >
            <motion.div
              className={styles.motorcycleFrame}
              variants={motoVariants} // Мотоцикл вибрирует
            >
              <motion.img
                src="/animation/back-wheel.png"
                className={styles.backWheel}
                variants={wheelVariants} // Колесо крутится
              />
              <motion.img
                src="/animation/front-wheel.png"
                className={styles.frontWheel}
                variants={wheelVariants} // Колесо крутится
              />
              <motion.img
                src="/animation/smoke.png"
                className={styles.smoke}
                variants={smokeVariants} // Колесо крутится
              />
            </motion.div>
          </motion.div>
        </div>

        <div className={styles.sidebar}>
          <MainCarousel />
        </div>
        <div className={styles.cell}>текст3</div>
        <div className={styles.cell}>текст4</div>
      </div>

      <div className={styles.decoration}></div>

      <p className={styles.brands}>Все популярные бренды у нас в наличии:</p>
      <ScrollableImageGallery />

      <div className={styles.decoration}></div>
    </div>
  );
};
