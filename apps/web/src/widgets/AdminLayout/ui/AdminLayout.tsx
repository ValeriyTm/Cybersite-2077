//Роутинг:
import { Link, Outlet } from "react-router";
//Состояния:
import { useProfile } from "@/features/auth";
import { useState } from "react";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./AdminLayout.module.scss";
import { ADMIN_MENU } from "../models/items";


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
      items: group.items.filter(item => !item.roles || item.roles.includes(userRole as string))
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

            {filteredMenu.map((section) => {
              return (
                <div key={section.group} className={styles.section}>
                  <h4 className={styles.sectionTitle}>{section.group}</h4>

                  {section.items.map((item) => {
                    // Создаем локальную переменную компонента с БОЛЬШОЙ буквы из каждого item
                    const IconComponent = item.icon;

                    return (
                      <Link key={item.link} to={item.link} className={styles.navLink}>
                        <span className={styles.icon}>
                          <IconComponent />
                        </span>
                        <span className={styles.linkText}>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )
            })}

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
