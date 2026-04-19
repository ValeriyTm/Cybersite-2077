import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

// Импорт стилей Swiper
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import styles from "./MainCarousel.module.scss";

const BANNERS = [
  {
    id: 1,
    src: "src/shared/assets/images/carousel/slide1.jpg",
    title: "CyberSite: Твой путь к свободе",
  },
  { id: 2, src: "src/shared/assets/images/carousel/slide2.jpg", title: "Новинки сезона 2026" },
  {
    id: 3,
    src: "src/shared/assets/images/carousel/slide3.jpg",
    title: "Лучший сервис и поддержка",
  },
  {
    id: 4,
    src: "src/shared/assets/images/carousel/slide4.jpg",
    title: "Выбор на любой вкус",
  },
  {
    id: 5,
    src: "src/shared/assets/images/carousel/slide5.jpg",
    title: "Почувствуй себя сильным",
  },
];

export const MainCarousel = () => {
  return (
    <div className={styles.bannerWrapper}>
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade" //Плавное затухание вместо обычного сдвига
        speed={1000}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={true}
        className={styles.mySwiper}
      >
        {BANNERS.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className={styles.slide}>
              <img src={banner.src} alt={banner.title} />
              <div className={styles.overlay}>
                <h2>{banner.title}</h2>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
