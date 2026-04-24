//Навигация:
import { Link } from "react-router";
//Состояния:
import { useAuthStore, useProfile } from "@/features/auth";
import { useThemeStore } from "@/entities/session";
//Компоненты:
import { GlobalDiscountBanner } from "@/widgets/GlobalDiscountBanner";
import { ReviewCard } from "@/shared/ui";
import { MainCarousel } from "@/widgets/MainCarousel";
import { ScrollableImageGallery } from "@/widgets/ScrollableImageGallery";
//Анимация:
import { motion, useReducedMotion } from "motion/react";
//API:
import { API_URL } from "@/shared/api/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Изображения:
import logoOrange from '@/shared/assets/images/logos/logo-orange.png';
import logoBlue from '@/shared/assets/images/logos/logo-blue.png';
import logoRetro from '@/shared/assets/images/logos/logo-retro.png';
import logoDoom from '@/shared/assets/images/logos/logo-doom.png';
import faceIcon1 from '@/shared/assets/images/reviews/face1.jpg';
import faceIcon2 from '@/shared/assets/images/reviews/face2.jpg';
import faceIcon3 from '@/shared/assets/images/reviews/face3.jpg';
import faceIcon4 from '@/shared/assets/images/reviews/face4.jpg';
import mainBanner from '@/shared/assets/images/banners/mainBanner.png'
import teamBanner1 from '@/shared/assets/images/banners/team.jpg'
import teamBanner2 from '@/shared/assets/images/banners/team1.jpg'
import motosBanner from '@/shared/assets/images/banners/motos.jpg'
import backWheelImage from '@/shared/assets/images/animation/back-wheel.png';
import frontWheelImage from '@/shared/assets/images/animation/front-wheel.png';
import smokeImage from '@/shared/assets/images/animation/smoke.png';
//Стили:
import styles from "./HomePage.module.scss";

export const HomePage = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const { user, isLoading } = useProfile();
  const { theme } = useThemeStore();
  const shouldReduceMotion = useReducedMotion();


  //Создаем правила анимации
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
        duration: 1.5, // Скорость одного выхлопа газов
        repeat: Infinity, // Повторять бесконечно
        ease: "easeOut",
      },
    },
  };

  //Путь к логотипу в зависимости от темы:
  let logoUrl;
  switch (theme) {
    case "theme-orange":
      logoUrl = logoOrange;
      break;
    case "theme-blue":
      logoUrl = logoBlue;
      break;
    case "theme-retrowave":
      logoUrl = logoRetro;
      break;
    case "theme-doom":
      logoUrl = logoDoom
  }

  const catalogLink = isAuth && user ? '/catalog' : '/auth';

  let texture;
  switch (theme) {
    case "theme-orange":
      texture = `decoration-orange`;
      break;
    case "theme-blue":
      texture = `decoration-blue`;
      break;
    case "theme-retrowave":
      texture = `decoration-retro`;
      break;
    case "theme-doom":
      texture = `decoration-doom`;
      break;
  }
  //----Анимация:----//
  const hoverAnimation = shouldReduceMotion ? undefined : "moving";
  //Если у пользователя включено ограничение анимации, то она просто не запустится


  //----SEO:-----//
  const canonicalUrl = `${API_URL}/`;
  ///
  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>Загрузка...</div>
    );

  return (
    <>
      <Helmet>
        <title>Cybersite-2077</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className={styles.homePage}>
        <GlobalDiscountBanner></GlobalDiscountBanner>

        {/*Hero Section:*/}
        <section className={styles.mainBannerSection}>
          {/*Left:*/}
          <div className={styles.mainBannerPartLeft}>
            <img
              decoding="sync"
              fetchPriority="high"
              src={mainBanner}
              alt="Главный баннер страницы"
              className={styles.bannerImage}
              width='952'
              height='600'
            />


          </div>
          {/*Right:*/}
          <div className={styles.mainBannerPartRight}>
            <img
              className={styles.bannerImageText}
              src={logoUrl}
              decoding="sync"
              fetchPriority="high"
              alt="Главное лого страницы"
              width='952'
              height='306'
            />
            <div className={styles.attentionBlock}>
              <span>Начни покупки с нами</span>
              <div className={styles.attentionWrapper}>
                <Link to={catalogLink}>
                  <button className={styles.attentionBtn}>Начать →</button>
                </Link>
              </div>

            </div>
          </div>
        </section>

        <div className={styles[texture]}></div>

        <div className={styles.container}>
          <div className={styles.cell1}>
            <p className={styles.textMain}>Наша команда:</p>
            <img
              src={teamBanner1}
              alt="Наша команда"
              loading="lazy"
              className={styles.teamImage}
              width='628'
              height='274'
            />
          </div>

          <div className={styles.cell2} aria-hidden='true'>
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
                  animate={shouldReduceMotion ? {} : wheelVariants}
                />
                <motion.img
                  src={frontWheelImage}
                  className={styles.frontWheel}
                  animate={shouldReduceMotion ? {} : wheelVariants}
                />
                <motion.img
                  src={smokeImage}
                  className={styles.smoke}
                  animate={shouldReduceMotion ? {} : smokeVariants}
                />
              </motion.div>
            </motion.div>
          </div>

          <div className={styles.sidebar} aria-hidden='true'>
            <MainCarousel />
          </div>

          <div className={styles.cell3}>
            <div className={styles.cont}>
              <div className={styles.delCont}>
                <img
                  src={teamBanner2}
                  alt="Подготовка мотоцикла к упаковке"
                  loading="lazy"
                  className={styles.delImage}
                  width='308'
                  height='308'
                />
              </div>
              <div className={styles.delCont}>
                <p className={styles.textMain}>Доставка:</p>
                <p>
                  Мы доставляем товары по всей территории РФ. Осуществляем
                  доставку до двери при любом количестве товара без праздников и
                  выходных 24/7. Стоимость определяется в зависимости от региона
                  заказа и складских остатков.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.cell4}>
            <div className={styles.cont}>
              <div className={styles.delCont}>
                <img
                  src={motosBanner}
                  alt="Несколько мотоциклов в ряд"
                  loading="lazy"
                  className={styles.delImage}
                  width='308'
                  height='308'
                />
              </div>
              <div className={styles.delCont}>
                <p className={styles.textMain}>Ассортимент:</p>
                <p>
                  В нашем интернет-магазине представлено более 35 тысяч единиц
                  товара от 518 брендов производителей. Для заказа кастомной
                  техники обращайтесь в поддержку.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles[texture]}></div>

        <p className={styles.brands}>Все популярные бренды у нас в наличии:</p>
        <ScrollableImageGallery />

        <div className={styles[texture]}></div>

        <div className={styles.reviewSection}>
          <p>Отзывы наших постоянных клиентов:</p>
          <div className={styles.reviewContainer}>
            <section className={styles.reviewCardSection}>
              <ReviewCard
                name="Алексей Иванов"
                avatarUrl={faceIcon1}
                rating={5}
                text="Периодически заказываю тут мотоэкипировку - дешевле на 15-20%, чем в других местах. Шлем, купленный тут 10 лет назад, до сих пор целый 👍"
              />
              <ReviewCard
                name="Регина Петрова"
                avatarUrl={faceIcon2}
                rating={4}
                text="Отличный магазин! Доставили быстро, товар качественный. Оранжевая упаковка просто огонь."
              />
              <ReviewCard
                name="Алихан Ахметов"
                avatarUrl={faceIcon3}
                rating={5}
                text="Поражает ассортимент мотоциклов! Есть даже модели начала 1900-х годов, вот это да!"
              />
              <ReviewCard
                name="Степан Васильев"
                avatarUrl={faceIcon4}
                rating={5}
                text="Постоянно тут покупаем детали для нашего мотосервиса. Радуют длительная гарантия и быстрые ответы поддержки"
              />
            </section>
          </div>
        </div>

        <div className={styles[texture]}></div>
      </div>

    </>
  );
};
