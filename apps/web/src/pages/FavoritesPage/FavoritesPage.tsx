import React from "react";
//Состояния:
import { useTradingStore, useFavoritesPage } from "@/entities/trading";
import { useState, useEffect } from "react";
//Компоненты:
import { MotorcycleCard } from "@/widgets/MotorcycleCard";
//Иконки:
import { FaArrowUp } from "react-icons/fa";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./FavoritesPage.module.scss";
import type { MotorcycleFull } from "@repo/types";

export const FavoritesPage = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFavoritesPage();

  const favoritesCount = useTradingStore((state) => state.favoritesCount);

  //-----------------------Подъем наверх экрана:--------------------//
  //Показывать кнопку подъема наверх страницы или нет:
  const [showScroll, setShowScroll] = useState(false);

  //Следим за прокруткой экрана, чтобы понять, выводить кнопку подъема или ещё рано:
  useEffect(() => {
    const checkScroll = () => {
      const scrolled = window.scrollY > 400;

      // Меняем стейт только, если текущее значение showScroll не совпадает с реальностью.
      if (scrolled !== showScroll) {
        setShowScroll(scrolled);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, [showScroll]);

  //Обработчик для плавного скролла экрана наверх:
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  //-----------------------------------------------------------
  if (favoritesCount === 0)
    return (
      <div className={styles.empty}>У вас пока нет избранных моделей 🤍</div>
    );


  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Мои избранные товары</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className={styles.Page}>
        <h1>Моё избранное ({favoritesCount})</h1>

        <div className={styles.list}>
          {data?.pages.map((group, i) => (
            <React.Fragment key={i}>
              {group.items.map((moto: MotorcycleFull) => {
                return (
                  <MotorcycleCard key={moto.id} moto={moto} viewMode="list" />
                )
              })}
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
