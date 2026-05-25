//Состояния:
import { useProfile } from "@/features/auth";
import { useThemeStore } from "@/entities/session";
//Компоненты:
import { GlobalDiscountBanner } from "@/widgets/GlobalDiscountBanner";
import { HeroBanner } from "./components/HeroBanner/HeroBanner";
import { MainCarousel } from "@/widgets/MainCarousel";
import { ScrollableImageGallery } from "@/widgets/ScrollableImageGallery";
//SEO:
import { Helmet } from 'react-helmet-async';
//Изображения:
import teamBanner1 from '@/shared/assets/images/banners/team.jpg'
import teamBanner2 from '@/shared/assets/images/banners/team1.jpg'
import motosBanner from '@/shared/assets/images/banners/motos.jpg'
//Стили:
import styles from "./HomePage.module.scss";
import { AnimatedMotorcycle } from "./components/AnimatedMotorcycle/AnimatedMotorcycle";
import { InfoCell } from "./components/InfoCell/InfoCell";
import { ReviewSection } from "./components/ReviewSection/ReviewSection";

const canonicalUrl = `${import.meta.env.VITE_SITE_URL}/`;

export const HomePage = () => {
  const { isLoading } = useProfile();
  const { theme } = useThemeStore();

  const texture = {
    "theme-orange": "decoration-orange",
    "theme-blue": "decoration-blue",
    "theme-retrowave": "decoration-retro",
    "theme-doom": "decoration-doom"
  }[theme] || "decoration-orange";

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
        <GlobalDiscountBanner />

        {/*Hero Section:*/}
        <HeroBanner />

        <div className={styles[texture]} />

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

          <AnimatedMotorcycle />

          <div className={styles.sidebar} aria-hidden='true'>
            <MainCarousel />
          </div>

          <InfoCell
            imageSrc={teamBanner2}
            altText="Подготовка мотоцикла к упаковке"
            title="Доставка:"
            description="Мы доставляем товары по всей территории РФ. Осуществляем доставку до двери при любом количестве товара без праздников и выходных 24/7. Стоимость определяется в зависимости от региона заказа и складских остатков."
          />

          <InfoCell
            imageSrc={motosBanner}
            altText="Несколько мотоциклов в ряд"
            title="Ассортимент:"
            description="В нашем интернет-магазине представлено более 35 тысяч единиц товара от 518 брендов производителей. Для заказа кастомной техники обращайтесь в поддержку."
          />
        </div>

        <div className={styles[texture]} />

        <p className={styles.brands}>Все популярные бренды у нас в наличии:</p>
        <ScrollableImageGallery />

        <div className={styles[texture]} />

        <ReviewSection />

        <div className={styles[texture]} />
      </div>
    </>
  );
};
