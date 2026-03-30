import React, { useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { TOP_BRANDS } from "../model/items";
import styles from "./Header.module.scss";

type MainCategory = "moto" | "gear" | "parts";

export const Header = () => {
  const { isAuth, user } = useAuthStore();
  //Состояние открытости каталога:
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  //Состояние выбранной категории:
  const [activeMainCat, setActiveMainCat] = useState<MainCategory>("moto");

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

            {/* Статическое выпадающее меню */}
            {isCatalogOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownContent}>
                  {/* ЛЕВАЯ ПАНЕЛЬ: Группы товаров 📂 */}
                  <aside className={styles.sideNav}>
                    <div
                      className={`${styles.sideItem} ${activeMainCat === "moto" ? styles.activeSide : ""}`}
                      onMouseEnter={() => setActiveMainCat("moto")}
                    >
                      <img
                        src="http://localhost:3001/static/icons/moto-icon.png"
                        alt="motorcycle icon"
                      />
                      <span>Мототехника</span>
                      <span className={styles.arrow}>›</span>
                    </div>

                    <div className={`${styles.sideItem} ${styles.disabled}`}>
                      <img
                        src="http://localhost:3001/static/icons/equip-icon.png"
                        alt="motorcycle equipment icon"
                      />
                      <span>Экипировка</span>
                      <span className={styles.arrow}>›</span>
                    </div>

                    <div className={`${styles.sideItem} ${styles.disabled}`}>
                      <img
                        src="http://localhost:3001/static/icons/gear-icon.png"
                        alt="gear icon"
                      />
                      <span>Запчасти</span>
                      <span className={styles.arrow}>›</span>
                    </div>
                  </aside>

                  {/* ПРАВАЯ ПАНЕЛЬ: Бренды (показываем только для 'moto') 🏍️ */}
                  <section className={styles.mainPanel}>
                    {activeMainCat === "moto" ? (
                      <div className={styles.brandsGrid}>
                        {TOP_BRANDS.map((brand) => {
                          const motoLink = `http://localhost:3001/static/moto_brands/${brand.slug}.png`;
                          return (
                            <Link
                              key={brand.slug}
                              to={`/catalog/motorcycles/${brand.slug}`}
                              className={styles.brandItem}
                              onClick={() => setIsCatalogOpen(false)}
                            >
                              <div className={styles.brandIcon}>
                                <img
                                  src={motoLink}
                                  alt="moto preview"
                                  className={styles.motoIcon}
                                />
                              </div>
                              <span>
                                Мотоциклы <strong>{brand.name}</strong>
                              </span>
                            </Link>
                          );
                        })}

                        {/* Кнопка "Прочие бренды" */}
                        <Link
                          to="/catalog/brands"
                          className={styles.brandItem}
                          onClick={() => setIsCatalogOpen(false)}
                        >
                          <div className={styles.brandIcon}>
                            <img
                              src="http://localhost:3001/static/moto_brands/scooter.png"
                              alt="default icon"
                            />
                          </div>
                          <span>Прочие бренды</span>
                        </Link>
                      </div>
                    ) : (
                      <div className={styles.emptyPanel}>
                        Скоро в продаже...
                      </div>
                    )}
                  </section>
                </div>
              </div>
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
