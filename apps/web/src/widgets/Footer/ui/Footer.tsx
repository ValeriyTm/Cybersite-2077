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

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        {/*Логотип*/}
        <Link to="/" className={styles.logolink}>
          <img src="/MainLogo.png" alt="Main Logo" className={styles.logo} />
        </Link>
        {/* <div className={styles.logoBlock}>
          <div className={styles.logoPlaceholder}>Лого</div>
        </div> */}

        {/* Навигация */}
        <div className={styles.column}>
          <h3>Каталог</h3>
          <Link to="/catalog/motorcycles">Бренды</Link>
          <Link to="">Мотоэкипировка</Link>
          <Link to="">Запчасти и расходники</Link>
        </div>

        <div className={styles.column}>
          <h3>Информация</h3>
          <Link to="/terms">Согласие на обработку данных</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
        </div>

        <div className={styles.column}>
          <h3>Компания</h3>
          <Link to="/contacts">Контакты</Link>
          <Link to="/about">О нас</Link>
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
      <div className={styles.socials}>
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
