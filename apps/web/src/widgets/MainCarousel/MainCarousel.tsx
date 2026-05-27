import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import { BANNERS } from "./items";
//Стили Swiper:
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
//Общие стили:
import styles from "./MainCarousel.module.scss";

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
