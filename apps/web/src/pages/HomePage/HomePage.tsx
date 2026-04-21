//Навигация:
import { Link } from "react-router";
//Состояния:
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { useProfile } from "@/features/auth/model/useProfile";
import { useThemeStore } from "@/entities/session/model/themeStore";
//Компоненты:
import { GlobalDiscountBanner } from "@/widgets/GlobalDiscountBanner/ui/GlobalDiscountBanner";
import ReviewCard from "@/shared/ui/ReviewCard/ReviewCard";
import { MainCarousel } from "@/widgets/MainCarousel/MainCarousel";
import { ScrollableImageGallery } from "@/widgets/ScrollableImageGallery/ScrollableImageGallery";
//Анимация:
import { motion } from "motion/react";
//API:
import { API_URL } from "@/shared/api/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./HomePage.module.scss";

export const HomePage = () => {
  //Из Zustand берем статус авторизации пользователя:
  const isAuth = useAuthStore((state) => state.isAuth);

  //Из React Query берем данные пользователя и состояние загрузки.
  //Используется isLoading, чтобы не показывать "Вы не авторизованы", пока идет запрос.
  const { user, isLoading } = useProfile();

  const { theme } = useThemeStore();


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

  //Путь к логотипу в зависимости от темы:
  let logoUrl;
  switch (theme) {
    case "theme-orange":
      logoUrl = `src/shared/assets/images/logos/logo-orange.png`;
      break;
    case "theme-blue":
      logoUrl = `src/shared/assets/images/logos/logo-blue.png`;
      break;
    case "theme-retrowave":
      logoUrl = `src/shared/assets/images/logos/logo-retro.png`;
      break;
    case "theme-doom":
      logoUrl = `src/shared/assets/images/logos/logo-doom.png`;
      break;
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
              src="src/shared/assets/images/banners/mainBanner.png"
              alt="Главный баннер страницы"
              className={styles.bannerImage}
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
              src="src/shared/assets/images/banners/team.jpg"
              alt=""
              className={styles.teamImage}
            />
          </div>

          <div className={styles.cell2}>
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
                  src="src/shared/assets/images/animation/back-wheel.png"
                  className={styles.backWheel}
                  variants={wheelVariants} // Колесо крутится
                />
                <motion.img
                  src="src/shared/assets/images/animation/front-wheel.png"
                  className={styles.frontWheel}
                  variants={wheelVariants} // Колесо крутится
                />
                <motion.img
                  src="src/shared/assets/images/animation/smoke.png"
                  className={styles.smoke}
                  variants={smokeVariants} // Колесо крутится
                />
              </motion.div>
            </motion.div>
          </div>

          <div className={styles.sidebar}>
            <MainCarousel />
          </div>

          <div className={styles.cell3}>
            <div className={styles.cont}>
              <div className={styles.delCont}>
                <img
                  src="src/shared/assets/images/banners/team1.jpg"
                  alt=""
                  className={styles.delImage}
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
                  src="src/shared/assets/images/banners/motos.jpg"
                  alt=""
                  className={styles.delImage}
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
                avatarUrl="src/shared/assets/images/reviews/face1.jpg"
                rating={5}
                text="Периодически заказываю тут мотоэкипировку - дешевле на 15-20%, чем в других местах. Шлем, купленный тут 10 лет назад, до сих пор целый 👍"
              />
              <ReviewCard
                name="Регина Петрова"
                avatarUrl="src/shared/assets/images/reviews/face2.jpg"
                rating={4}
                text="Отличный магазин! Доставили быстро, товар качественный. Оранжевая упаковка просто огонь."
              />
              <ReviewCard
                name="Алихан Ахметов"
                avatarUrl="src/shared/assets/images/reviews/face3.jpg"
                rating={5}
                text="Поражает ассортимент мотоциклов! Есть даже модели начала 1900-х годов, вот это да!"
              />
              <ReviewCard
                name="Степан Васильев"
                avatarUrl="src/shared/assets/images/reviews/face4.jpg"
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
