import { useLayoutStore } from '@/entities/session/model/layoutStore';
import styles from './MobileMenu.module.scss';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { useThemeStore } from '@/entities/session/model/themeStore';
import { useProfile } from '@/features/auth/model/useProfile';
import { useAuthStore } from '@/features/auth/model/useAuthStore';

export const MobileMenu = () => {
    const { isMenuOpen, closeMenu } = useLayoutStore();
    const { theme } = useThemeStore();
    const { user } = useProfile();
    const { isAuth } = useAuthStore();

    // Блокируем скролл основной страницы, когда меню открыто
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

    if (!isMenuOpen) return null;

    return (
        <div className={styles.overlay} onClick={closeMenu}>
            <div className={styles.menuContent} onClick={(e) => e.stopPropagation()}>
                {/*Логотип*/}
                <Link to="/" className={styles.logolink}>
                    <img src={logoUrl} alt="Main Logo" className={styles.logo} />
                </Link>

                <nav className={styles.nav}>

                    <p>
                        {isAuth && user ? user.name : "Войти"}
                    </p>
                    <Link to="/">Главная 🏠</Link>
                    <Link to="/profile">В личный кабинет 👤</Link>
                    <Link to="/profile/favorites">Моё избранное ❤️</Link>
                    <Link to="/cart">Моя корзина 🛒</Link>
                    <Link to="/orders/my">Мои заказы 📦</Link>
                    <Link to="/about">О компании ℹ️</Link>
                    {/* <Link to="/shipping">Доставка и оплата</Link> */}
                    <Link to="/contacts">Контакты 📞</Link>
                    <Link to="/news">Новости 📰</Link>
                    <Link to="/promos">Промокоды 🎫</Link>
                    <Link to="/support">Поддержка 💬</Link>
                    {canSee && <Link to="/admin">Управление ⚙️</Link>}
                </nav>




            </div>
        </div>
    );
};
