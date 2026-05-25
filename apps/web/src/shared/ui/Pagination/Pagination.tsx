import styles from "./Pagination.module.scss";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null; // Если страница всего одна, пагинацию вообще не рендерим

  // Логика расчета диапазона отображаемых цифр
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  if (end === totalPages) start = Math.max(1, end - 4);

  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <footer className={styles.pagination}>
      {/* В самое начало */}
      <button
        className={styles.navBtn}
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        title="В начало"
      >
        &laquo;&laquo;
      </button>

      {/* Назад */}
      <button
        className={styles.navBtn}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &laquo;
      </button>

      {/* Цифры страниц */}
      <div className={styles.numbers}>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`${styles.pageBtn} ${currentPage === pageNumber ? styles.active : ""}`}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      {/* Вперед */}
      <button
        className={styles.navBtn}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        &raquo;
      </button>

      {/* В самый конец */}
      <button
        className={styles.navBtn}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        title="В конец"
      >
        &raquo;&raquo;
      </button>
    </footer>
  );
};
