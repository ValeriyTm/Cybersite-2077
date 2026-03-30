import React, { useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/features/auth/model/auth-store";
import styles from "./Header.module.scss";

export const Header = () => {
  const { isAuth, user } = useAuthStore();
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <header className={styles.Header}>
      {/* 1. Верхняя часть: Ссылки */}
      <div className={styles.topLine}>
        <div className={styles.container}>
          <nav className={styles.topNav}>
            <Link to="/about">О компании</Link>
            <Link to="/shipping">Доставка и оплата</Link>
            <Link to="/contacts">Контакты</Link>
            <Link to="/news">Новости</Link>
          </nav>
        </div>
      </div>

      {/* 2. Нижняя часть: Основные инструменты */}
      <div className={styles.mainLine}>
        <div className={styles.container}>
          {/* Логотип */}
          <Link to="/" className={styles.logolink}>
            <img src="/MainLogo.png" alt="Main Logo" className={styles.logo} />
          </Link>

          {/* Кнопка каталога с Hover-меню */}
          <div
            className={styles.catalogWrapper}
            onMouseEnter={() => setIsCatalogOpen(true)}
            onMouseLeave={() => setIsCatalogOpen(false)}
          >
            <Link to="/catalog/motorcycles" className={styles.catalogBtn}>
              <span className={styles.burger}>☰</span> Каталог
            </Link>

            {/* Статическое выпадающее меню (реализуем следующим шагом) */}
            {isCatalogOpen && (
              <div className={styles.dropdown}>...бренды...</div>
            )}
          </div>

          {/* Поиск с подсказками (Autocomplete) */}
          <div className={styles.searchBox}>
            <input type="text" placeholder="Поиск по каталогу" />
            <button>Найти</button>
            {/* Тут будет выпадающий список результатов от Elastic */}
          </div>

          {/* Блок пользователя и Заглушки */}
          <div className={styles.userActions}>
            <Link
              to={isAuth ? "/profile" : "/auth"}
              className={styles.profileLink}
            >
              <div className={styles.avatar}>
                <img src={user?.avatar || "/defaults/avatar.jpg"} alt="User" />
              </div>
              <span>{isAuth ? user?.name : "Войти"}</span>
            </Link>

            <button className={styles.iconBtn} title="Избранное">
              ❤️ <span className={styles.counter}>0</span>
            </button>

            <button className={styles.iconBtn} title="Корзина">
              🛒 <span className={styles.counter}>0</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
