//Роутер:
import { Link } from "react-router";
//Хранилища:
import { useAuthStore } from "@/features/auth/model/useAuthStore"; //Клиентское
import { useProfile } from "@/features/auth/model/useProfile"; //Серверное
import { GlobalDiscountBanner } from "@/widgets/GlobalDiscountBanner/ui/GlobalDiscountBanner";
import styles from "./HomePage.module.scss";
import { MainCarousel } from "@/widgets/MainCarousel/MainCarousel";
import { ScrollableImageGallery } from "@/widgets/ScrollableImageGallery/ScrollableImageGallery";

export const HomePage = () => {
  //Из Zustand берем статус авторизации пользователя:
  const isAuth = useAuthStore((state) => state.isAuth);

  //Из React Query берем данные пользователя и состояние загрузки.
  //Используется isLoading, чтобы не показывать "Вы не авторизованы", пока идет запрос.
  const { user, isLoading } = useProfile();

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
          <div className={styles.cellContainer}>
            <div className={styles.motoWrapper}>
              {/* <img
                src="/animation/moto-frame.png"
                alt="part of animation"
                className={styles.motorcycleFrame}
              /> */}
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
            </div>
            {/* <img
              src="/animation/back-wheel.png"
              alt="part of animation"
              className={`${styles.overlay} ${styles.img2}`}
            /> */}
            {/* <img
              src="/animation/front-wheel.png"
              alt="part of animation"
              className={`${styles.overlay} ${styles.img3}`}
            /> */}
          </div>
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
