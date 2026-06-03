//Роутинг:
import { Link } from 'react-router';
//Состояния:
import { useEffect } from 'react';
import { useLayoutStore, useThemeStore } from '@/entities/session';
import { useProfile, useAuthStore } from '@/features/auth';
//Прочее:
import { getLogoByTheme } from "@/entities/session";
//Стили:
import styles from './MobileMenu.module.scss';
import { HeaderLink } from '@/shared/ui';

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
    ["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR", "WATCHER"].includes(user.role);
  const canSee = isAuth && isAdmin;

  const logoUrl = getLogoByTheme(theme);

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
              <HeaderLink to="/profile" end>{isAuth ? "Личный кабинет" : "Войти"} 👤</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/" end>Главная 🏠</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/profile/favorites" end>Моё избранное ❤️</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/cart" end>Моя корзина 🛒</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/orders/my" end>Мои заказы 📦</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/about" end>О компании ℹ️</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/contacts" end>Контакты 📞</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/news" end>Новости 📰</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/promos" end>Промокоды 🎫</HeaderLink>
            </li>
            <li>
              <HeaderLink to="/support" end>Поддержка 💬</HeaderLink>
            </li>
            {canSee && <li>
              <HeaderLink to="/admin" end>Админ ⚙️</HeaderLink>
            </li>}
          </ul>
        </nav>
      </div>
    </div>
  );
};
