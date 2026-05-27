//Роутинг:
import { Link } from "react-router";
//Состояние:
import { useAuthStore, useProfile } from "@/features/auth";
import { useThemeStore } from "@/entities/session";
//Изображения:
import logoOrange from '@/shared/assets/images/logos/logo-orange.png';
import logoBlue from '@/shared/assets/images/logos/logo-blue.png';
import logoRetro from '@/shared/assets/images/logos/logo-retro.png';
import logoDoom from '@/shared/assets/images/logos/logo-doom.png';
import mainBanner from '@/shared/assets/images/banners/mainBanner.png';
//Стили:
import styles from "./HeroBanner.module.scss";
import { Button } from "@/shared/ui";

export const HeroBanner = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const { user } = useProfile();
  const { theme } = useThemeStore();

  // Путь к логотипу в зависимости от темы
  let logoUrl;
  switch (theme) {
    case "theme-orange": logoUrl = logoOrange; break;
    case "theme-blue": logoUrl = logoBlue; break;
    case "theme-retrowave": logoUrl = logoRetro; break;
    case "theme-doom": logoUrl = logoDoom; break;
    default: logoUrl = logoOrange;
  }

  const catalogLink = isAuth && user ? '/catalog' : '/auth';

  return (
    <section className={styles.mainBannerSection}>
      {/* Левая часть */}
      <div className={styles.mainBannerPartLeft}>
        <img
          decoding="sync"
          fetchPriority="high"
          src={mainBanner}
          alt="Главный баннер страницы"
          className={styles.bannerImage}
          width="952"
          height="600"
        />
      </div>

      {/* Правая часть */}
      <div className={styles.mainBannerPartRight}>
        <img
          className={styles.bannerImageText}
          src={logoUrl}
          decoding="sync"
          fetchPriority="high"
          alt="Главное лого страницы"
          width="952"
          height="306"
        />
        <div className={styles.attentionBlock}>
          <span>Начни покупки с нами</span>
          <div className={styles.attentionWrapper}>
            <Button
              to={catalogLink}
              variant="parade"
            >
              Начать →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
