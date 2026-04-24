//Роутинг:
import { Link } from "react-router";
//Состояния:
import { useThemeStore } from "@/entities/session";
//Иконки:
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
//Изображения:
import logoOrange from '@/shared/assets/images/logos/logo-orange.png';
import logoBlue from '@/shared/assets/images/logos/logo-blue.png';
import logoRetro from '@/shared/assets/images/logos/logo-retro.png';
import logoDoom from '@/shared/assets/images/logos/logo-doom.png';
//Стили:
import styles from "./Footer.module.scss";

export const Footer = () => {
  const { theme } = useThemeStore();

  const currentYear = new Date().getFullYear();

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

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          {/*Логотип*/}
          <Link to="/" className={styles.logolink}>
            <img src={logoUrl} alt="Main Logo" className={styles.logo} width='200' height='100' />
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
              <a href="/" aria-label="Facebook" className={styles.facebook}>
                <FaFacebook aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Twitter" className={styles.twitter}>
                <FaTwitter aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Tiktok" className={styles.tiktok}>
                <FaTiktok aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Vkontakte" className={styles.vk}>
                <FaVk aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Youtube" className={styles.youtube}>
                <FaYoutube aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Telegram" className={styles.telegram}>
                <FaTelegram aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Whatsapp" className={styles.whatsapp}>
                <FaWhatsapp aria-hidden="true" focusable="false" />
              </a>
            </li>
            <li>
              <a href="/" aria-label="Viber" className={styles.viber}>
                <FaViber aria-hidden="true" focusable="false" />
              </a>
            </li>
          </ul>
        </div>

        <hr className={styles.divider} />

        {/* Нижняя часть: */}
        <div className={styles.bottom}>
          <span>©<time dateTime={String(currentYear)}>{currentYear}</time> Cybersite-2077 &nbsp;&nbsp;&nbsp;&nbsp;|</span>
          <Link to="/agreement">Пользовательское соглашение</Link>
        </div>
      </div>
    </footer>
  );
};
