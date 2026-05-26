import { useMotorcycleFilters } from "@/entities/catalog";
//Компоненты:
import { Select } from "@/shared/ui";
//Стили:
import styles from "./CatalogSorting.module.scss";

const SORT_OPTIONS = [
  { value: "name_asc", label: "По алфавиту (А-Я)" },
  { value: "name_desc", label: "По алфавиту (Я-А)" },
  { value: "price_asc", label: "Сначала дешевые" },
  { value: "price_desc", label: "Сначала дорогие" },
  { value: "year_desc", label: "Сначала новые" },
  { value: "rating_desc", label: "Высокий рейтинг" },
];

export const CatalogSorting = () => {
  const { filters, updateFilters } = useMotorcycleFilters();

  return (
    <div className={styles.sorting}>
      <Select
        id="sorting-select"
        label="Сортировать:"
        options={SORT_OPTIONS}
        value={filters.sortBy || "name_asc"}
        onChange={(e) => updateFilters({ sortBy: e.target.value })}
        variant="dark"
        direction="row"
      />
    </div>
  );
};
