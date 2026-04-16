import { useLayoutStore } from '@/entities/session/model/layoutStore';
import styles from './BurgerButton.module.scss';

export const BurgerButton = () => {
    const { isMenuOpen, toggleMenu } = useLayoutStore();

    return (
        <button
            className={`${styles.burger} ${isMenuOpen ? styles.active : ''}`}
            onClick={toggleMenu}
            aria-label="Menu"
        >
            <span></span>
            <span></span>
            <span></span>
        </button>
    );
};
