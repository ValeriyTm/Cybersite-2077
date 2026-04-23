//Состояния:
import { useState, useMemo, useEffect, useRef } from "react";
import { useAuthStore, useProfile } from "@/features/auth";
import { useTradingStore } from "@/entities/trading";
import { useOrderStore } from "@/entities/ordering";
import { useThemeStore } from "@/entities/session";
//Роутинг:
import { Link, useNavigate } from "react-router";
//Типы:
import { type MotorcycleShort } from "@/entities/catalog";
import { TOP_BRANDS } from "../model/items";
//API:
import { $api, API_URL } from "@/shared/api";
//Компоненты:
import { Avatar } from "@/shared/ui";
//Дебаунс для поиска:
import debounce from "lodash/debounce";
//Стили:
import styles from "./Header.module.scss";

type MainCategory = "moto" | "gear" | "parts";

export const Header = () => {
  //Состояние открытости выпадающего каталога:
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  //Состояние выбранной категории:
  const [activeMainCat, setActiveMainCat] = useState<MainCategory>("moto");
  //Переключение темы:
  const { theme, setTheme } = useThemeStore();

  const navigate = useNavigate();

  //Состояние для поиска с подсказками:
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MotorcycleShort[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const { activeOrdersCount, fetchActiveCount } = useOrderStore();

  const { resetOrders } = useOrderStore();
  const { clearTrading, fetchCart, fetchFavoritesIds } = useTradingStore();


  const isAuth = useAuthStore((state) => state.isAuth);
  const { user, isLoading } = useProfile();

  //Формируем путь к аватару:
  const avatarSrc = user?.avatarUrl
    ? `${API_URL}${user.avatarUrl}`
    : null; // Передаем null, чтобы сработал дефолт внутри Avatar.tsx

  //Дебаунс запроса:
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (q: string) => {
        try {
          const { data } = await $api.get(
            `/catalog/search/suggest?q=${q}`,
          );
          setSuggestions(data);
        } catch (e) {
          console.error(e);
        }
      }, 300),
    [],
  );


  //При загркузке получаем кол-во активных заказов:
  useEffect(() => {
    if (isAuth) fetchActiveCount();
  }, [isAuth]);

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

  useEffect(() => {
    if (isAuth) {
      fetchCart(); //Данные о корзине
      fetchFavoritesIds(); //Данные о избранном
      fetchActiveCount(); //Данные о активных заказах
    } else {
      clearTrading();
      resetOrders();
    }
  }, [isAuth]);
  //Если пользователь логинится, то грузим инфу о заказах и т.п. Если логаут - обнуляем.

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

  //Количество избранных товаров:
  const { favoritesCount } = useTradingStore();

  //Количество товаров в корзине:
  const cartCount = useTradingStore((state) =>
    state.cartItems.reduce((acc, item) => acc + item.quantity, 0),
  );

  //Для иконок смены темы:
  const themes = [
    { id: 'theme-orange', img: 'src/shared/assets/images/theme/theme-icon1.png', title: 'Тема Orange' },
    { id: 'theme-blue', img: 'src/shared/assets/images/theme/theme-icon4.png', title: 'Тема Blue' },
    { id: 'theme-retrowave', img: 'src/shared/assets/images/theme/theme-icon2.png', title: 'Тема Retrowave' },
    { id: 'theme-doom', img: 'src/shared/assets/images/theme/theme-icon3-alternative.png', title: 'Тема DOOM' },
  ];
  //-----------
  //Путь к логотипу в зависимости от темы:
  let logoUrl;
  switch (theme) {
    case "theme-orange":
      logoUrl = `src/shared/assets/images/logos/logo-orange.png`;
      break;
    case "theme-blue":
      logoUrl = `src/shared/assets/images/logos/logo-blue.png`;
      break;
    case "theme-retrowave":
      logoUrl = `src/shared/assets/images/logos/logo-retro.png`;
      break;
    case "theme-doom":
      logoUrl = `src/shared/assets/images/logos/logo-doom.png`;
      break;
  }
  //-----------
  //Включение темы с клавиатуры:
  const handleKeyDown = (event: React.KeyboardEvent, themeId: any) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Чтобы страница не скроллилась при нажатии пробела
      setTheme(themeId);
    }
  };

  //----------
  //Показывать ссылку на страницу администраторов или нет:
  const isAdmin =
    user?.role &&
    ["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"].includes(user.role);
  const canSee = isAuth && isAdmin;
  //--------------------------------------------------------------------------
  return (
    <header className={styles.Header}>
      {/*1)Верхняя часть: Ссылки */}
      <div className={styles.topLine}>
        <div className={styles.container}>
          <div className={styles.topWrapper}>
            {/*1.1)Навбар:*/}
            <nav className={styles.topNav}>
              <ul>
                <li>
                  <Link to="/">Главная</Link>
                </li>
                <li>
                  <Link to="/about">О компании</Link>
                </li>
                <li>
                  <Link to="/contacts">Контакты</Link>
                </li>
                <li>
                  <Link to="/news">Новости</Link>
                </li>
                <li>
                  <Link to="/promos">Промокоды</Link>
                </li>
                <li>
                  <Link to="/support">Поддержка</Link>
                </li>
                {canSee && <li>
                  <Link to="/admin">Админ</Link>
                </li>}
              </ul>

            </nav>

            {/*1.2)Смена темы:*/}
            <div className={styles.themeSwitcher}>
              {themes.map((t) => (
                <button type='button' key={t.id} className={styles.themeWrapper} onClick={() => setTheme(t.id as any)} title={t.title}>
                  <img
                    src={t.img}
                    alt={t.title}
                    className={theme === t.id ? styles.active : styles.inactive}
                    width='33'
                    height='33'
                  />
                </button>
              ))}
            </div>

            <Link to="/" className={styles.logolinkHidden}>
              <img src={logoUrl} alt="Main Logo" className={styles.logo} width="102" height="33" />
            </Link>
          </div>
        </div>
      </div>

      {/*2)Нижняя часть: Основные инструменты */}
      <div className={styles.mainLine}>
        <div className={styles.container}>
          <div className={styles.mainWrapper}>
            <div className={styles.leftBotMenu}>

              {/*2.1)Логотип*/}
              <Link to="/" className={styles.logolink}>
                <img src={logoUrl} alt="Main Logo" className={styles.logo} width="245" height="78" />
              </Link>

              {/*2.2)Кнопка каталога с Hover-меню*/}
              <div
                className={styles.catalogWrapper}
                onMouseEnter={() => setIsCatalogOpen(true)}
                onMouseLeave={() => setIsCatalogOpen(false)}
                aria-expanded={isCatalogOpen}
                aria-controls="catalog-preview"
              >
                <Link to="/catalog" className={styles.catalogBtn}>
                  <span className={styles.burger}>☰</span> Каталог
                </Link>

                {/*Статическое выпадающее меню */}
                {isCatalogOpen && (
                  <div className={styles.dropdown} id='catalog-preview' hidden={!isCatalogOpen}>
                    <div className={styles.dropdownContent}>
                      {/*Левая часть выпадающего меню: Группы товаров*/}
                      <aside className={styles.sideNav}>
                        <div
                          className={`${styles.sideItem} ${activeMainCat === "moto" ? styles.activeSide : ""}`}
                          onMouseEnter={() => setActiveMainCat("moto")}
                        >
                          <img
                            src={`src/shared/assets/icons/catalog-icons/moto-icon.png`}
                            alt="motorcycle icon"
                            width='24'
                            height='24'
                          />
                          <span>Мототехника</span>
                          <span className={styles.arrow}>›</span>
                        </div>

                        <div className={`${styles.sideItem} ${styles.disabled}`}>
                          <img
                            src={`src/shared/assets/icons/catalog-icons/equip-icon.png`}
                            alt="motorcycle equipment icon"
                            width='24'
                            height='24'
                          />
                          <span>Экипировка</span>
                          <span className={styles.arrow}>›</span>
                        </div>

                        <div className={`${styles.sideItem} ${styles.disabled}`}>
                          <img
                            src={`src/shared/assets/icons/catalog-icons/gear-icon.webp`}
                            alt="gear icon"
                            width='24'
                            height='24'
                          />
                          <span>Запчасти</span>
                          <span className={styles.arrow}>›</span>
                        </div>
                      </aside>

                      {/*Правая часть выпадающего меню: бренды*/}
                      <section className={styles.mainPanel}>
                        {activeMainCat === "moto" ? (
                          <div className={styles.brandsGrid}>
                            {TOP_BRANDS.map((brand) => {
                              const motoLink = `src/shared/assets/icons/moto_brands/${brand.slug}.png`;
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
                                      alt={`moto ${brand.name}`}
                                      className={styles.motoIcon}
                                      width='32'
                                      height='32'
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
                                  src={`src/shared/assets/icons/moto_brands/scooter.png`}
                                  alt="alternative brand icon"
                                  width='32'
                                  height='32'
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

              {/*2.3)Поиск с подсказками (Autocomplete) */}
              <form
                className={styles.searchBox}
                onSubmit={handleSearchSubmit}
                ref={searchRef}
              >
                <label htmlFor="main-search" className="visually-hidden">Поиск по каталогу</label>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  placeholder="Поиск по каталогу"
                  id='main-search'

                />
                <button type="submit">Найти</button>

                {suggestions.length > 0 && (
                  <div className={styles.suggestions}>
                    {suggestions.map((moto) => {
                      const linkToImage = moto.mainImage
                        ? `${API_URL}/static/motorcycles/${moto.mainImage}`
                        : `images/default-card-icon.jpg`;
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
                            <img src={linkToImage} alt="moto image" width='50' height='35' />
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
            </div>

            <div className={styles.rightBotMenu}>
              {/*2.4)Блок пользователя:*/}
              <div className={styles.userActions}>
                <Link
                  to={isAuth ? "/profile" : "/auth"}
                  className={styles.profileLink}
                >
                  <Avatar
                    src={isAuth ? avatarSrc : null}
                    alt={user?.name || "Гость"}
                    size="sm"
                    isAvatarLoading={isLoading} //Показываем спиннер, пока идет /refresh
                  />

                  <div className={styles.userInfo} title={user?.name || ''}>
                    <span className={styles.userName}>
                      {/* Если авторизован и не грузится — имя, иначе "Войти" */}
                      {isAuth && user && !isLoading ? user.name : "Войти"}
                    </span>
                  </div>
                </Link>
              </div>

              {/*2.5)Блок заказов:*/}
              <div className={styles.userOrders}>
                {/*Кнопка избранного со счетчиком: */}
                <Link
                  to="/profile/favorites"
                  className={styles.iconBtn}
                  title="Избранное"
                >
                  ❤️
                  {favoritesCount > 0 && (
                    <span className={styles.counter}>{favoritesCount}</span>
                  )}
                </Link>

                {/*Кнопка корзины со счетчиком:*/}
                <Link to="/cart" title="Корзина" className={styles.iconBtn}>

                  🛒{" "}
                  {cartCount > 0 && (
                    <span className={styles.counter}>{cartCount}</span>
                  )}

                </Link>

                {/*Кнопка заказов со счетчиком:*/}
                <Link to="/orders/my" className={styles.iconBtn} title="Мои заказы">
                  📦
                  {activeOrdersCount > 0 && (
                    <span className={`${styles.counter}`}>
                      {activeOrdersCount}
                    </span>
                  )}
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
