import { Link } from "react-router";
import {
  FaFacebook,
  FaTelegram,
  FaWhatsapp,
  FaViber,
  FaTwitter,
  FaTiktok,
  FaVk,
  FaYoutube,
} from "react-icons/fa";
import styles from "./Footer.module.scss";
import { useThemeStore } from "@/entities/session/model/themeStore";

export const Footer = () => {
  const { theme } = useThemeStore();

  const currentYear = new Date().getFullYear();

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

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          {/*Логотип*/}
          <Link to="/" className={styles.logolink}>
            <img src={logoUrl} alt="Main Logo" className={styles.logo} />
          </Link>


          {/* Навигация */}
          <div className={styles.column}>
            <h3>Каталог</h3>
            <ul>
              <li>
                <Link to="/catalog/motorcycles">Бренды</Link>
              </li>
              <li>
                <Link to="/catalog">Мотоэкипировка</Link>
              </li>
              <li>
                <Link to="/catalog">Запчасти и расходники на любые модели</Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3>Информация</h3>
            <ul>
              <li>
                <Link to="/terms">Согласие на обработку данных</Link>
              </li>
              <li>
                <Link to="/privacy">Политика конфиденциальности</Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3>Компания</h3>
            <ul>
              <li>
                <Link to="/contacts">Контакты</Link>
              </li>
              <li>
                <Link to="/about">О нас</Link>
              </li>
            </ul>
            <div className={styles.contacts}>
              <a href="tel:+79830000000">+7(000) 000 00-00</a>
              <a href="mailto:info@cybersite2077.com">info@cybersite2077.com</a>
            </div>
          </div>

          {/* Кнопка поддержки */}
          <div className={styles.supportColumn}>
            <h3>Остались вопросы?</h3>
            <p>Задайте их нам прямо сейчас!</p>
            <Link to="/support" className={styles.supportBtn}>
              Задать вопрос
            </Link>
          </div>
        </div>

        {/* Иконки соцсетей: */}
        <div className={styles.soc1als}>
          <ul>
            <li>
              <a href="/" aria-label="Facebook">
                <FaFacebook className={styles.facebook} aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Twitter">
                <FaTwitter className={styles.twitter} aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Tiktok">
                <FaTiktok className={styles.tiktok} aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Vkontakte">
                <FaVk className={styles.vk} aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Youtube">
                <FaYoutube className={styles.youtube} aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Telegram">
                <FaTelegram className={styles.telegram} aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Whatsapp">
                <FaWhatsapp className={styles.whatsapp} aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Viber">
                <FaViber className={styles.viber} aria-hidden="true" focusable="false" />
              </a>
            </li>
          </ul>
        </div>

        <hr className={styles.divider} />

        {/* Нижняя часть: */}
        <div className={styles.bottom}>
          <span>©<time datetime={currentYear}>{currentYear}</time> Cybersite-2077 &nbsp;&nbsp;&nbsp;&nbsp;|</span>
          <Link to="/agreement">Пользовательское соглашение</Link>
        </div>
      </div>
    </footer>
  );
};
