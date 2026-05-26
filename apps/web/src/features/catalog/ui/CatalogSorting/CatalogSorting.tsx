import { useMotorcycleFilters } from "@/entities/catalog";
//Стили:
import styles from "./CatalogSorting.module.scss";

export const CatalogSorting = () => {
  const { filters, updateFilters } = useMotorcycleFilters();

  return (
    <div className={styles.sorting}>
      <label className={styles.sortLabel} htmlFor="sorting-select">
        Сортировать:
      </label>
      <select
        className={styles.sortSelect}
        value={filters.sortBy || "name_asc"}
        id="sorting-select"
        onChange={(e) => updateFilters({ sortBy: e.target.value })}
      >
        <option value="name_asc">По алфавиту (А-Я)</option>
        <option value="name_desc">По алфавиту (Я-А)</option>
        <option value="price_asc">Сначала дешевые</option>
        <option value="price_desc">Сначала дорогие</option>
        <option value="year_desc">Сначала новые</option>
        <option value="rating_desc">Высокий рейтинг</option>
      </select>
    </div>
  );
};
