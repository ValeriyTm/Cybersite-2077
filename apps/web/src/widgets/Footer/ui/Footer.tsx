//Роутинг:
import { Link } from "react-router";
//Состояния:
import { useThemeStore } from "@/entities/session";
//Компоненты:
import { Button, SocialsList } from "@/shared/ui";
//Прочее:
import { getLogoByTheme } from "@/entities/session";
//Стили:
import styles from "./Footer.module.scss";

export const Footer = () => {
  const { theme } = useThemeStore();
  const currentYear = new Date().getFullYear();
  const logoUrl = getLogoByTheme(theme);

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

            <Button to="/support" variant="outline-dark">
              Задать вопрос
            </Button>
          </div>
        </div>

        {/* Иконки соцсетей: */}
        <SocialsList />

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
