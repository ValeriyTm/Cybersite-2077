import React, { useEffect, useState } from "react";
import { fetchBrands, type Brand, BrandCard } from "@/entities/catalog";
import styles from "./BrandPage.module.scss";

export const BrandPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const LIMIT = 24; // Оптимально для сетки 3x8 или 4x6

  useEffect(() => {
    setIsLoading(true);
    fetchBrands(currentPage, LIMIT)
      .then((data) => {
        setBrands(data.items);
        setTotalPages(data.pages);
      })
      .finally(() => setIsLoading(false));
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.BrandsPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>Мировые бренды</h1>
        <p className={styles.subtitle}>
          Всего в базе представлено более 500 производителей мототехники
        </p>
      </header>

      {isLoading ? (
        <div className={styles.loader}>Загрузка брендов...</div>
      ) : (
        <div className={styles.grid}>
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      {/* Простая пагинация */}
      <footer className={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className={styles.pageBtn}
        >
          Назад
        </button>

        <span className={styles.pageInfo}>
          Страница <strong>{currentPage}</strong> из {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className={styles.pageBtn}
        >
          Вперед
        </button>
      </footer>
    </main>
  );
};
