//Состояние:
import { useLayoutStore } from '@/entities/session';
//Стили:
import styles from './BurgerButton.module.scss';

export const BurgerButton = () => {
    const { isMenuOpen, toggleMenu } = useLayoutStore();

    return (
        <button
            className={`${styles.burger} ${isMenuOpen ? styles.active : ''}`}
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Menu"
        >
            <span></span>
            <span></span>
            <span></span>
        </button>
    );
};
