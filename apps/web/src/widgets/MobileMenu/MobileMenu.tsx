//Роутинг:
import { Link } from 'react-router';
//Состояния:
import { useEffect } from 'react';
import { useLayoutStore, useThemeStore } from '@/entities/session';
import { useProfile, useAuthStore } from '@/features/auth';
//Изображения:
import logoOrange from '@/shared/assets/images/logos/logo-orange.png';
import logoBlue from '@/shared/assets/images/logos/logo-blue.png';
import logoRetro from '@/shared/assets/images/logos/logo-retro.png';
import logoDoom from '@/shared/assets/images/logos/logo-doom.png';
//Стили:
import styles from './MobileMenu.module.scss';

export const MobileMenu = () => {
  const { isMenuOpen, closeMenu } = useLayoutStore();
  const { theme } = useThemeStore();
  const { user } = useProfile();
  const { isAuth } = useAuthStore();

  //Блокируем скролл основной страницы, когда меню открыто:
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
  }, [isMenuOpen]);

  //Показывать ссылку на страницу администраторов или нет:
  const isAdmin =
    user?.role &&
    ["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"].includes(user.role);
  const canSee = isAuth && isAdmin;

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

  if (!isMenuOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeMenu} hidden={!isMenuOpen} id="mobile-menu">
      <div className={styles.menuContent} onClick={(e) => e.stopPropagation()}>
        {/*Логотип*/}
        <Link to="/" className={styles.logolink}>
          <img src={logoUrl} alt="Main Logo" className={styles.logo} width='240' height='77' />
        </Link>

        <nav className={styles.nav}>

          <p>
            {isAuth && user ? user.name : "Анонимус"}
          </p>

          <ul>
            <li>
              <Link to="/profile">{isAuth ? "Личный кабинет" : "Войти"} 👤</Link>
            </li>
            <li>
              <Link to="/">Главная 🏠</Link>
            </li>
            <li>
              <Link to="/profile/favorites">Моё избранное ❤️</Link>
            </li>
            <li>
              <Link to="/cart">Моя корзина 🛒</Link>
            </li>
            <li>
              <Link to="/orders/my">Мои заказы 📦</Link>
            </li>
            <li>
              <Link to="/about">О компании ℹ️</Link>
            </li>
            <li>
              <Link to="/contacts">Контакты 📞</Link>
            </li>
            <li>
              <Link to="/news">Новости 📰</Link>
            </li>
            <li>
              <Link to="/promos">Промокоды 🎫</Link>
            </li>
            <li>
              <Link to="/support">Поддержка 💬</Link>
            </li>
            {canSee && <li>
              <Link to="/admin">Управление ⚙️</Link>
            </li>}
          </ul>
        </nav>
      </div>
    </div>
  );
};
