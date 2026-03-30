// import React, { useEffect, useState, useCallback } from "react";
import React, { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchBrands, type Brand, BrandCard } from "@/entities/catalog";
import debounce from "lodash/debounce";
//Компонент Breadcrumbs:
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
//Стили:
import styles from "./BrandPage.module.scss";

export const BrandPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Извлекаем данные из URL (Источник истины):
  const currentPage = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  // 2. React Query: заменяем ручной fetch:
  const { data, isLoading } = useQuery({
    queryKey: ["brands", currentPage, search],
    queryFn: () => fetchBrands(currentPage, 24, search),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const totalPages = data?.pages || 1;

  // const [brands, setBrands] = useState<Brand[]>([]);
  // const [search, setSearch] = useState("");
  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1);
  // const [isLoading, setIsLoading] = useState(false);

  // 3. Универсальная функция обновления URL
  const updateParams = (
    newParams: Record<string, string | number | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
      else params.delete(key);
    });
    if (!newParams.page) params.set("page", "1"); // Сброс на 1 при поиске
    setSearchParams(params);
  };

  // // 🎯 Дебаунс поиска, чтобы не спамить сервер на каждую букву
  // const debouncedSearch = useCallback(
  //   debounce((value: string) => {
  //     setSearch(value);
  //     setCurrentPage(1); // При поиске всегда возвращаемся на 1 страницу
  //   }, 500),
  //   [],
  // );

  // useEffect(() => {
  //   setIsLoading(true);
  //   fetchBrands(currentPage, 24, search)
  //     .then((data) => {
  //       setBrands(data.items);
  //       setTotalPages(data.pages);
  //     })
  //     .finally(() => setIsLoading(false));
  // }, [currentPage, search]);

  // const handlePageChange = (page: number) => {
  //   if (page < 1 || page > totalPages) return;
  //   setCurrentPage(page);
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // };

  // 🎯 Функция генерации массива страниц
  // const renderPageNumbers = () => {
  //   const pages = [];
  //   const maxVisible = 5; // Сколько кнопок с числами показывать вокруг текущей

  //   let start = Math.max(1, currentPage - 2);
  //   let end = Math.min(totalPages, start + maxVisible - 1);

  //   if (end === totalPages) {
  //     start = Math.max(1, end - maxVisible + 1);
  //   }

  //   for (let i = start; i <= end; i++) {
  //     pages.push(
  //       <button
  //         key={i}
  //         onClick={() => handlePageChange(i)}
  //         className={`${styles.pageBtn} ${currentPage === i ? styles.active : ""}`}
  //       >
  //         {i}
  //       </button>,
  //     );
  //   }
  //   return pages;
  // };

  // 4. Дебаунс для поиска
  const debouncedSearch = useMemo(
    () => debounce((val: string) => updateParams({ search: val }), 500),
    [searchParams],
  );

  //Хлебные крошки:
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog/motorcycles" }, // Текущая страница
  ];

  return (
    <main className={styles.BrandsPage}>
      {/*Breadcrumbs:*/}
      <Breadcrumbs items={breadcrumbs} />

      <header className={styles.header}>
        <h1 className={styles.title}>Мировые бренды</h1>
        <p className={styles.subtitle}>Более 500 производителей в нашей базе</p>

        {/*Поле поиска */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Найти бренд (напр. Honda)..."
            className={styles.searchInput}
            defaultValue={search} // Берем из URL при загрузке
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Индикация загрузки */}
      {isLoading && !data && <div className={styles.loader}>Загрузка...</div>}

      {/* Карточки брендов: */}
      <div className={styles.grid}>
        {data?.items.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
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
              let end = Math.min(totalPages, start + 4);
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
  );
};
