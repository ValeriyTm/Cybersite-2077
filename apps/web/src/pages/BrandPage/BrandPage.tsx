import React, { useEffect, useState, useCallback } from "react";
import { fetchBrands, type Brand, BrandCard } from "@/entities/catalog";
import debounce from "lodash/debounce";
import styles from "./BrandPage.module.scss";

export const BrandPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 🎯 Дебаунс поиска, чтобы не спамить сервер на каждую букву
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setCurrentPage(1); // При поиске всегда возвращаемся на 1 страницу
    }, 500),
    [],
  );

  useEffect(() => {
    setIsLoading(true);
    fetchBrands(currentPage, 24, search)
      .then((data) => {
        setBrands(data.items);
        setTotalPages(data.pages);
      })
      .finally(() => setIsLoading(false));
  }, [currentPage, search]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🎯 Функция генерации массива страниц
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Сколько кнопок с числами показывать вокруг текущей

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end === totalPages) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageBtn} ${currentPage === i ? styles.active : ""}`}
        >
          {i}
        </button>,
      );
    }
    return pages;
  };

  return (
    <main className={styles.BrandsPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>Мировые бренды</h1>
        <p className={styles.subtitle}>Более 500 производителей в нашей базе</p>

        {/* 🔍 Поле поиска */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Найти бренд (напр. Honda)..."
            className={styles.searchInput}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.grid}>
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>

      <footer className={styles.pagination}>
        <button
          className={styles.navBtn}
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          &laquo;
        </button>

        <div className={styles.numbers}>{renderPageNumbers()}</div>

        <button
          className={styles.navBtn}
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          &raquo;
        </button>
      </footer>
    </main>
  );
};
