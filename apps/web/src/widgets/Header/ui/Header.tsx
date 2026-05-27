//Состояния:
import { useEffect } from "react";
import { HeaderUserButton, useAuthStore, useProfile } from "@/features/auth";
import { useTradingStore } from "@/entities/trading";
import { useOrderStore } from "@/entities/ordering";
import { useThemeStore } from "@/entities/session";
//Роутинг:
import { Link } from "react-router";
//Прочее:
import { getLogoByTheme } from "@/entities/session";
//Компоненты:
import { HeaderCatalog, SearchWithSuggestions } from "@/features/catalog";
import { HeaderNav } from "./components/HeaderNav";
import { ThemeSwitcher } from "@/features/session";
//Стили:
import styles from "./Header.module.scss";
import { HeaderUserActions } from "@/features/trading";

export const Header = () => {
  const { theme } = useThemeStore(); //Переключение темы

  const resetOrders = useOrderStore((state) => state.resetOrders);
  const fetchActiveCount = useOrderStore((state) => state.fetchActiveCount); //Получаем актуальные данные по активным заказам
  const clearTrading = useTradingStore((state) => state.clearTrading);

  const isAuth = useAuthStore((state) => state.isAuth);
  const { user } = useProfile();


  //Если пользователь логинится, то грузим инфу об активных заказах. Если логаут - обнуляем (в т.ч. корзину и избранное).
  useEffect(() => {
    if (isAuth) {
      fetchActiveCount(); //Данные об активных заказах
    } else {
      clearTrading(); //Очистка счетчика корзины и избранного
      resetOrders(); //Очистка счетчика активных заказов
    }
  }, [isAuth]);

  const logoUrl = getLogoByTheme(theme);  //Путь к лого

  //Показывать ли ссылку на страницу админ-панели:
  const isAdmin = (user?.role &&
    ["ADMIN", "SUPERADMIN", "MANAGER", "CONTENT_EDITOR"].includes(user.role)) ? true : false;
  const canSeeAdmin = isAuth && isAdmin;

  return (
    <header className={styles.Header}>
      {/*1)Верхняя часть: навбар и смена темы */}
      <div className={styles.topLine}>
        <div className={styles.container}>
          <div className={styles.topWrapper}>
            {/*1.1)Навбар:*/}
            <HeaderNav canSeeAdmin={canSeeAdmin} />

            {/*1.2)Смена темы:*/}
            <ThemeSwitcher />

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

              {/*2.2)Кнопка каталога с hover-меню*/}
              <HeaderCatalog />

              {/*2.3)Поиск с подсказками (autocomplete) */}
              <SearchWithSuggestions />
            </div>

            <div className={styles.rightBotMenu}>
              {/*2.4)Блок пользователя:*/}
              <HeaderUserButton />

              {/*2.5)Блок заказов:*/}
              <HeaderUserActions />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
