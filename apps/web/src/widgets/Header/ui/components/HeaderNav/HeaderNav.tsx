//Компоненты:
import { HeaderLink } from "@/shared/ui";
//Стили:
import styles from "./HeaderNav.module.scss";

interface HeaderNavProps {
  canSeeAdmin: boolean;
}

export const HeaderNav = ({ canSeeAdmin }: HeaderNavProps) => {
  // Декларативный массив ссылок для чистоты разметки
  const navLinks = [
    { to: "/", label: "Главная", end: true },
    { to: "/about", label: "О компании" },
    { to: "/contacts", label: "Контакты" },
    { to: "/news", label: "Новости" },
    { to: "/promos", label: "Промокоды" },
    { to: "/support", label: "Поддержка" },
  ];

  return (
    <nav className={styles.topNav}>
      <ul>
        {navLinks.map((link) => (
          <li key={link.to}>
            <HeaderLink to={link.to} end={link.end}>
              {link.label}
            </HeaderLink>
          </li>
        ))}
        {/* Админская ссылка рендерится по условию прав */}
        {canSeeAdmin && (
          <li>
            <HeaderLink to="/admin">Админ</HeaderLink>
          </li>
        )}
      </ul>
    </nav>
  );
};
