import { Link } from "react-router";
//Стили:
import styles from "./Breadcrumbs.module.scss";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className={styles.Breadcrumbs}>
      <ul className={styles.list}>
        <li className={styles.item}>
          <Link to="/">Главная</Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className={styles.item}>
            <span className={styles.separator}>/</span>
            {item.href ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span className={styles.current}>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
