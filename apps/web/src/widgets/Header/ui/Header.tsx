import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { useProfile } from "@/features/auth/model/useProfile";
import { TOP_BRANDS } from "../model/items";
import debounce from "lodash/debounce";
import { type MotorcycleShort } from "@/entities/catalog/model/types";
import axios from "axios";
import { Avatar } from "@/shared/ui/Avatar";
import styles from "./Header.module.scss";

type MainCategory = "moto" | "gear" | "parts";

export const Header = () => {
  //Состояние открытости каталога:
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  //Состояние выбранной категории:
  const [activeMainCat, setActiveMainCat] = useState<MainCategory>("moto");

  const navigate = useNavigate();

  //Состояние для поиска с подсказками:
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MotorcycleShort[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  //--------Для работы с данными юзера:
  //Технический статус из Zustand:
  const isAuth = useAuthStore((state) => state.isAuth);
  //Реальные данные и статус загрузки из React Query:
  const { user, isLoading } = useProfile();
  //Формируем путь к аватару:
  const avatarSrc = user?.avatarUrl
    ? `http://localhost:3001${user.avatarUrl}`
    : null; // Передаем null, чтобы сработал дефолт внутри Avatar.tsx

  //Дебаунс запроса:
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (q: string) => {
        try {
          const { data } = await axios.get(
            `http://localhost:3001/api/catalog/search/suggest?q=${q}`,
          );
          setSuggestions(data);
        } catch (e) {
          console.error(e);
        }
      }, 300),
    [],
  );

  //Закрытие при клике мимо:
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 2) fetchSuggestions(val);
    else setSuggestions([]);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim().length >= 2) {
      //Переходим в общий каталог с активным поиском:
      navigate(
        `/catalog/motorcycles/all?search=${encodeURIComponent(searchQuery)}`,
      );
      setSuggestions([]); //Закрываем подсказки
    }
  };

  return (
    <header className={styles.Header}>
      {/*1)Верхняя часть: Ссылки */}
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

      {/*2)Нижняя часть: Основные инструменты */}
      <div className={styles.mainLine}>
        <div className={styles.container}>
          {/*Логотип*/}
          <Link to="/" className={styles.logolink}>
            <img src="/MainLogo.png" alt="Main Logo" className={styles.logo} />
          </Link>

          {/*Кнопка каталога с Hover-меню*/}
          <div
            className={styles.catalogWrapper}
            onMouseEnter={() => setIsCatalogOpen(true)}
            onMouseLeave={() => setIsCatalogOpen(false)}
          >
            <Link to="/catalog/motorcycles" className={styles.catalogBtn}>
              <span className={styles.burger}>☰</span> Каталог
            </Link>

            {/*Статическое выпадающее меню */}
            {isCatalogOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownContent}>
                  {/*Левая часть выпадающего меню: Группы товаров*/}
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

                  {/*Правая часть ыпаадающего меню: бренды*/}
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

                        {/*Кнопка "Прочие бренды" */}
                        <Link
                          to="/catalog/motorcycles"
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
          <form
            className={styles.searchBox}
            onSubmit={handleSearchSubmit}
            ref={searchRef}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              placeholder="Поиск по каталогу"
            />
            <button type="submit">Найти</button>

            {suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((moto) => {
                  const linkToImage = moto.mainImage
                    ? `http://localhost:3001/static/motorcycles/${moto.mainImage}`
                    : "http://localhost:3001/static/defaults/default-card-icon.jpg";
                  return (
                    <Link
                      key={moto.id}
                      to={`/catalog/motorcycles/${moto.brandSlug}/${moto.slug}`}
                      className={styles.suggestItem}
                      onClick={() => {
                        setSuggestions([]);
                        setSearchQuery("");
                      }}
                    >
                      <div className={styles.suggestImg}>
                        <img src={linkToImage} alt="" />
                      </div>
                      <div className={styles.suggestInfo}>
                        <span className={styles.suggestModel}>
                          {moto.model}
                        </span>
                        <span className={styles.suggestYear}>
                          {moto.year} г.
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </form>

          {/* Блок пользователя и заглушки */}
          <div className={styles.userActions}>
            <Link
              to={isAuth ? "/profile" : "/auth"}
              className={styles.profileLink}
            >
              <Avatar
                src={isAuth ? avatarSrc : null}
                alt={user?.name || "Гость"}
                size="sm"
                isAvatarLoading={isLoading} // Показываем спиннер, пока идет /refresh
              />

              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {/* Если авторизован и не грузится — имя, иначе "Войти" */}
                  {isAuth && user && !isLoading ? user.name : "Войти"}
                </span>
              </div>
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
