import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useFavoritesPage } from "@/entities/trading/api/useFavoritesPage";
import React from "react";
import styles from "./FavotiresPage.module.scss";
import { MotorcycleCard } from "@/entities/catalog";
import { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";

export const FavoritesPage = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFavoritesPage();
  const { favoriteIds } = useTradingStore();
  const [showScroll, setShowScroll] = useState(false);

  if (favoriteIds.length === 0)
    return (
      <div className={styles.empty}>У вас пока нет избранных моделей 🤍</div>
    );

  //Следим за прокруткой:
  useEffect(() => {
    const checkScroll = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, [showScroll]);

  // Плавный скролл наверх
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.Page}>
      <h1>Моё избранное ({favoriteIds.length})</h1>

      <div className={styles.list}>
        {data?.pages.map((group, i) => (
          <React.Fragment key={i}>
            {group.items.map((moto) => (
              <MotorcycleCard key={moto.id} data={moto} viewMode="list" />
            ))}
          </React.Fragment>
          //React.Fragment используется как невидимый контейнер для группировки списка элементов внутри метода .map().
        ))}
      </div>

      {/* Кнопка "Наверх" */}
      <button
        className={`${styles.scrollToTop} ${showScroll ? styles.visible : ''}`}
        onClick={scrollTop}
        aria-label="Наверх"
      >
        <FaArrowUp />
      </button>

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
  );
};
