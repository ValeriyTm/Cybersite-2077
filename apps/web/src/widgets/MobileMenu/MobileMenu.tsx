import { useLayoutStore } from '@/entities/session/model/layoutStore';
import styles from './MobileMenu.module.scss';
import { useEffect } from 'react';

export const MobileMenu = () => {
    const { isMenuOpen, closeMenu } = useLayoutStore();

    // Блокируем скролл основной страницы, когда меню открыто
    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
    }, [isMenuOpen]);

    if (!isMenuOpen) return null;

    return (
        <div className={styles.overlay} onClick={closeMenu}>
            <div className={styles.menuContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.menuContent}>
                    <button className={styles.closeBtn} onClick={closeMenu}>✕</button>
                    <nav className={styles.nav}>...</nav>
                </div>
                <nav className={styles.nav}>
                    {/* Здесь будут твои ссылки, которые ты заполнишь сам */}
                    <div className={styles.placeholder}>[ МЕСТО ДЛЯ ТВОИХ ДАННЫХ ]</div>
                    <div>hahaha</div>
                    <div>hehehe</div>
                    <div>hihihi</div>
                </nav>
                <p>текст</p>
            </div>
        </div>
    );
};
