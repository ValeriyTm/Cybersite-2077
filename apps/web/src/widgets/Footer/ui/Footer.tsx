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
      logoUrl = `/logos/logo-orange.png`;
      break;
    case "theme-blue":
      logoUrl = `/logos/logo-blue.png`;
      break;
    case "theme-retrowave":
      logoUrl = `/logos/logo-retro.png`;
      break;
    case "theme-doom":
      logoUrl = `/logos/logo-doom.png`;
      break;
  }

  return (
    <footer className={styles.footer}>
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
              <Link to="">Мотоэкипировка</Link>
            </li>
            <li>
              <Link to="">Запчасти и расходники</Link>
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
            <a href="tel:+79830000000">+7(000) 000 00-00</a> <br></br>
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

      {/* Иконки соцсетей */}
      <div className={styles.soc1als}>
        <FaFacebook className={styles.facebook} /> <FaTelegram className={styles.telegram} /> <FaWhatsapp className={styles.whatsapp} /> <FaViber className={styles.viber} />
        <FaTwitter className={styles.twitter} /> <FaTiktok className={styles.tiktok} /> <FaVk className={styles.vk} /> <FaYoutube className={styles.youtube} />
      </div>

      <hr className={styles.divider} />

      {/* Нижняя часть */}
      <div className={styles.bottom}>
        <span>©{currentYear} Cybersite-2077 &nbsp;&nbsp;&nbsp;&nbsp;|</span>
        <Link to="/agreement">Пользовательское соглашение</Link>
      </div>
    </footer>
  );
};
