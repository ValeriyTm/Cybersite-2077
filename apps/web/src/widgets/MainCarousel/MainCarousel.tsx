import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
//Изображения:
import slideImage1 from '@/shared/assets/images/carousel/slide1.jpg';
import slideImage2 from '@/shared/assets/images/carousel/slide2.jpg';
import slideImage3 from '@/shared/assets/images/carousel/slide3.jpg';
import slideImage4 from '@/shared/assets/images/carousel/slide4.jpg';
import slideImage5 from '@/shared/assets/images/carousel/slide5.jpg';
//Стили Swiper:
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import styles from "./MainCarousel.module.scss";

const BANNERS = [
  {
    id: 1,
    src: slideImage1,
    title: "CyberSite: Твой путь к свободе",
  },
  { id: 2, src: slideImage2, title: "Новинки сезона 2026" },
  {
    id: 3,
    src: slideImage3,
    title: "Лучший сервис и поддержка",
  },
  {
    id: 4,
    src: slideImage4,
    title: "Выбор на любой вкус",
  },
  {
    id: 5,
    src: slideImage5,
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
              <img src={banner.src} alt={banner.title} width='628' height='646' />
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
