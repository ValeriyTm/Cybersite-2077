import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { BrandCard, useBrands } from "@/entities/catalog";
//Для поиска:
import debounce from "lodash/debounce";
//Компоненты:
import { Breadcrumbs } from "@/shared/ui";
//API:
import { API_URL } from "@/shared/api";
//Типы:
import { type Brand } from '@/entities/catalog/model/types';
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./BrandPage.module.scss";

export const BrandPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  //Извлекаем данные (номер страницы и поисковый запрос) из URL:
  const currentPage = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  //Получаем данные о брендах:
  const { data, isLoading } = useBrands({ page: currentPage, limit: 24, search });

  //Всего страниц:
  const totalPages = data?.pages || 1;

  //Функция для обновления get-параметров в URL:
  const updateParams = useCallback((
    newParams: Record<string, string | number | undefined>,
  ) => {
    //Достаем текущие параметры из URL и записываем в params:
    const params = new URLSearchParams(searchParams);
    //Обновление значений get-параметров в params в соответствии с новыми newParams:
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
      else params.delete(key);
    });
    if (!newParams.page) params.set("page", "1"); //Сброс на первую страницу при поиске
    setSearchParams(params); //Обновляем URL в поисковой строке
  }, [searchParams, setSearchParams]);

  //Дебаунс для поиска:
  const debouncedSearch = useMemo(
    () => debounce((val: string) => updateParams({ search: val }), 500),
    [updateParams],
  );

  //Хлебные крошки:
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog" },
    { label: "Бренды", href: "/catalog/motorcycles" }, // Текущая страница
  ];

  //SEO:
  const canonicalUrl = `${API_URL}/catalog/motorcycles`;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Мотобренды</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <main className={styles.BrandsPage}>
        {/*Breadcrumbs:*/}
        <Breadcrumbs items={breadcrumbs} />

        <header className={styles.header}>
          <h1 className={styles.title}>Мировые бренды</h1>
          <p className={styles.subtitle}>Более 500 производителей в нашей базе</p>

          {/*Поле поиска */}
          <div className={styles.searchContainer}>
            <label htmlFor="brand-search" className="visually-hidden">Поиск бренда</label>
            <input
              type="search"
              placeholder="Найти бренд (напр. Honda)..."
              className={styles.searchInput}
              id='brand-search'
              defaultValue={search} //Берем из URL при загрузке
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
        </header>

        {/* Индикация загрузки */}
        {isLoading && !data && <div className={styles.loader}>Загрузка...</div>}

        {/* Карточки брендов: */}
        <div className={styles.grid}>
          {data?.items.map((brand: Brand) => {
            return (
              <BrandCard key={brand.id} brand={brand} />
            )
          })}
        </div>

        {/* Пагинация: */}
        {totalPages > 1 && (
          <footer className={styles.pagination}>
            <button
              className={styles.navBtn}
              disabled={currentPage === 1}
              onClick={() => updateParams({ page: 1 })}
              title="В начало"
            >
              &laquo;&laquo;
            </button>

            <button
              className={styles.navBtn}
              disabled={currentPage === 1}
              onClick={() => updateParams({ page: currentPage - 1 })}
            >
              &laquo;
            </button>

            <div className={styles.numbers}>
              {(() => {
                const pages = [];
                let start = Math.max(1, currentPage - 2);
                const end = Math.min(totalPages, start + 4);
                if (end === totalPages) start = Math.max(1, end - 4);

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => updateParams({ page: i })}
                      className={`${styles.pageBtn} ${currentPage === i ? styles.active : ""}`}
                    >
                      {i}
                    </button>,
                  );
                }
                return pages;
              })()}
            </div>

            <button
              className={styles.navBtn}
              disabled={currentPage === totalPages}
              onClick={() => updateParams({ page: currentPage + 1 })}
            >
              &raquo;
            </button>

            <button
              className={styles.navBtn}
              disabled={currentPage === totalPages}
              onClick={() => updateParams({ page: totalPages })}
              title="В конец"
            >
              &raquo;&raquo;
            </button>
          </footer>
        )}
      </main>
    </>
  );
};
