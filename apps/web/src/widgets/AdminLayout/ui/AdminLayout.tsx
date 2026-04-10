import { Link, Outlet } from "react-router";
import {
  FaMotorcycle,
  FaBoxOpen,
  FaShoppingCart,
  FaQuestionCircle,
  FaPercentage,
  FaFileAlt,
  FaUsersCog,
  FaChartBar,
} from "react-icons/fa"; // Используем Font Awesome из react-icons
import styles from "./AdminLayout.module.scss";

const ADMIN_MENU = [
  {
    group: "Работа с каталогом",
    items: [
      { name: "Бренды", link: "/admin/brands", icon: <FaBoxOpen /> },
      { name: "Мотоциклы", link: "/admin/motorcycles", icon: <FaMotorcycle /> },
      { name: "Склады и наличие", link: "/admin/stocks", icon: <FaBoxOpen /> },
    ],
  },
  {
    group: "Заказы",
    items: [
      { name: "Все заказы", link: "/admin/orders", icon: <FaShoppingCart /> },
    ],
  },
  {
    group: "Вопросы пользователей",
    items: [
      {
        name: "Тикеты саппорта",
        link: "/admin/tickets",
        icon: <FaQuestionCircle />,
      },
    ],
  },
  {
    group: "Маркетинг и аналитика",
    items: [
      { name: "Скидки", link: "/admin/discounts", icon: <FaPercentage /> },
      { name: "Отчеты", link: "/admin/reports", icon: <FaFileAlt /> },
      { name: "Статистика", link: "/admin/stats", icon: <FaChartBar /> },
    ],
  },
  {
    group: "Управление доступом",
    items: [
      { name: "Пользователи", link: "/admin/users", icon: <FaUsersCog /> },
    ],
  },
];

export const AdminLayout = () => {
  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          CYBER<span>ADMIN</span>
        </div>
        <nav className={styles.nav}>
          {ADMIN_MENU.map((section) => (
            <div key={section.group} className={styles.section}>
              <h4 className={styles.sectionTitle}>{section.group}</h4>
              {section.items.map((item) => (
                <Link key={item.link} to={item.link} className={styles.navLink}>
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.linkText}>{item.name}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.adminHeader}>
          <h2>Панель управления</h2>
          <div className={styles.adminInfo}>
            {/* Сюда можно будет вывести имя залогиненного админа */}
            <span>Admin Mode</span>
          </div>
        </header>
        <section className={styles.pageBody}>
          <Outlet />
        </section>
      </main>
    </div>
  );
};
