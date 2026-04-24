import React from "react";
//Состояния:
import { useTradingStore, useFavoritesPage } from "@/entities/trading";
import { useState, useEffect } from "react";
//Компоненты:
import { MotorcycleCard } from "@/entities/catalog";
//Иконки:
import { FaArrowUp } from "react-icons/fa";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./FavotiresPage.module.scss";

export const FavoritesPage = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFavoritesPage();
  //Массив id избранных моделей:
  const { favoriteIds } = useTradingStore();
  //Показывать кнопку подъема наверх страницы или нет:
  const [showScroll, setShowScroll] = useState(false);

  if (favoriteIds.length === 0)
    return (
      <div className={styles.empty}>У вас пока нет избранных моделей 🤍</div>
    );

  //-----------------------Подъем наверх экрана:--------------------//
  //Следим за прокруткой экрана, чтобы понять, выводить кнопку подъема или ещё рано:
  useEffect(() => {
    const checkScroll = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", checkScroll); //Браузер начинает «слушать» прокрутку сразу после монтирования компонента
    //Теперь функция checkScroll вызывается при каждом событии скролла.

    return () => window.removeEventListener("scroll", checkScroll); //Когда пользователь уйдет с этой страницы (компонент размонтируется), мы удаляем слушатель.
  }, [showScroll]);

  //Обработчик для плавного скролла экрана наверх:
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Мои избранные товары</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className={styles.Page}>
        <h1>Моё избранное ({favoriteIds.length})</h1>

        <div className={styles.list}>
          {data?.pages.map((group, i) => (
            <React.Fragment key={i}>
              {group.items.map((moto: any) => (
                <MotorcycleCard key={moto.id} data={moto} viewMode="list" />
              ))}
            </React.Fragment>
            //React.Fragment используется как невидимый контейнер для группировки списка элементов внутри метода .map().
          ))}
        </div>

        {/*Кнопка подъема "Наверх":*/}
        <button
          className={`${styles.scrollToTop} ${showScroll ? styles.visible : ''}`}
          onClick={scrollTop}
          aria-label="Наверх страницы"
        >
          <FaArrowUp />
        </button>

        {/*Кнопка для загрузки новых карточек мотоциклов:*/}
        {hasNextPage && (
          <button
            className={styles.loadMore}
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Загрузка..." : "Показать еще"}
          </button>
        )}
      </main>
    </>
  );
};
