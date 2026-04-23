//Роутинг:
import { Link, Outlet } from "react-router";
//Состояния:
import { useProfile } from "@/features/auth";
import { useState } from "react";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import {
  FaMotorcycle,
  FaBoxOpen,
  FaShoppingCart,
  FaQuestionCircle,
  FaPercentage,
  FaFileAlt,
  FaUsersCog,
  FaChartBar,
  FaNewspaper
} from "react-icons/fa";
//Стили:
import styles from "./AdminLayout.module.scss";

const ADMIN_MENU = [
  {
    group: "Работа с каталогом",
    items: [
      { name: "Бренды", link: "/admin/brands", icon: <FaBoxOpen />, roles: ["MANAGER", "ADMIN", "SUPERADMIN"], },
      { name: "Мотоциклы", link: "/admin/motorcycles", icon: <FaMotorcycle /> },
      { name: "Склады и наличие", link: "/admin/stocks", icon: <FaBoxOpen />, roles: ["MANAGER", "ADMIN", "SUPERADMIN"], },
    ],
  },
  {
    group: "Заказы",
    items: [
      { name: "Все заказы", link: "/admin/orders", icon: <FaShoppingCart />, roles: ["MANAGER", "ADMIN", "SUPERADMIN"], },
    ],
  },
  {
    group: "Вопросы пользователей",
    items: [
      {
        name: "Тикеты саппорта",
        link: "/admin/tickets",
        icon: <FaQuestionCircle />,
        roles: ["MANAGER", "ADMIN", "SUPERADMIN"],
      },
    ],
  },
  {
    group: "Маркетинг и аналитика",
    items: [
      { name: "Скидки", link: "/admin/discounts", icon: <FaPercentage />, roles: ["MANAGER", "ADMIN", "SUPERADMIN"], },
      { name: "Отчеты", link: "/admin/reports", icon: <FaFileAlt />, roles: ["MANAGER", "ADMIN", "SUPERADMIN"], },
    ],
  },
  {
    group: "Техническое обслуживание",
    items: [
      { name: "Техническое обслуживание", link: "/admin/stats", icon: <FaChartBar />, roles: ["ADMIN", "SUPERADMIN"], },
    ],
  },
  {
    group: "Контент",
    items: [
      { name: "Новости", link: "/admin/news", icon: <FaNewspaper />, roles: ["CONTENT_EDITOR", "ADMIN", "SUPERADMIN"] },
    ],
  },
  {
    group: "Управление доступом",
    items: [
      { name: "Пользователи", link: "/admin/users", icon: <FaUsersCog />, roles: ["SUPERADMIN"], },
    ],
  },
];

export const AdminLayout = () => {
  const { user } = useProfile(); //Данные юзера
  const userRole = user?.role; //Роль юзера

  //Состояние для сайдбара на мобилке:
  const [isOpen, setIsOpen] = useState(false);
  const toggleFilter = () => {
    setIsOpen(!isOpen);
  };

  //Определяем список отображаемых полей для сайдбара в зависимости от роли юзера:
  const filteredMenu = ADMIN_MENU
    .map(group => ({
      ...group,
      //Оставляем только те ссылки, где роль совпадает или доступ открыт для всех:
      items: group.items.filter(item => !item.roles || item.roles.includes(userRole))
    }))
    //Убираем пустые группы, в которых не осталось доступных ссылок:
    .filter(group => group.items.length > 0);

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Админ-панель</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className={styles.adminContainer}>
        <aside className={` ${isOpen ? styles.sidebarMobile : styles.sidebar}`}>
          <div className={styles.logo}>
            CYBER<span>ADMIN</span>
          </div>
          <nav className={styles.nav}>
            <h3 className="visually-hidden">Категории админ-панели</h3>
            {filteredMenu.map((section) => (
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
            <h1 className="visually-hidden">Админ-панель</h1>
            <h2>Панель управления |&nbsp;</h2>
            <div className={styles.adminInfo}>
              <span><strong>{userRole}</strong> Mode</span>
            </div>
            <div className={styles.panelBtnWrapper}>
              {/*Кнопка открытия сайдбара на узких экранах:*/}
              <button className={styles.panelBtn} type="button" onClick={toggleFilter}>
                Открыть панель
              </button>
            </div>

          </header>
          <section className={styles.pageBody}>
            <Outlet />
          </section>
        </main>
      </div>
    </>
  );
};
