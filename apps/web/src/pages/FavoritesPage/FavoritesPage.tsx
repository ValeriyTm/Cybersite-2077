import React from "react";
//Состояния:
import { useTradingStore, useFavoritesPage } from "@/entities/trading";
//Компоненты:
import { MotorcycleCard } from "@/widgets/MotorcycleCard";
import { Button, ScrollToTopButton } from "@/shared/ui";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./FavoritesPage.module.scss";
import type { MotorcycleFull } from "@repo/types";

export const FavoritesPage = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFavoritesPage();
  const favoritesCount = useTradingStore((state) => state.favoritesCount);


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
          {data?.pages.map((group) =>
            group.items.map((moto: MotorcycleFull) => (
              <MotorcycleCard
                key={moto.id}
                moto={moto}
                viewMode="list"
                onFavoritePage
              />
            ))
          )}
        </div>

        {/*Кнопка подъема "Наверх":*/}
        <ScrollToTopButton />

        {/*Кнопка для загрузки новых карточек мотоциклов:*/}
        {hasNextPage && (
          <div className={styles.loadMoreWrapper}>
            <Button
              type="button"
              variant="outline-dark"
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              loadingText="Загрузка..."
            >
              Показать еще
            </Button>
          </div>
        )}
      </main>
    </>
  );
};
