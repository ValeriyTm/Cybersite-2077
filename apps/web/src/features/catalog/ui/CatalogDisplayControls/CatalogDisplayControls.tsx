import { useMotorcycleFilters, useCatalogStore } from "@/entities/catalog";
//Иконки:
import { LuLayoutGrid, LuLayoutList } from "react-icons/lu";
//Стили:
import styles from "./CatalogDisplayControls.module.scss";

export const CatalogDisplayControls = () => {
  const { filters, updateFilters } = useMotorcycleFilters();
  const { viewMode, setViewMode } = useCatalogStore();

  return (
    <div className={styles.displayControls}>
      {/* Переключатель лимита (кол-ва товаров) */}
      <div className={styles.limitSwitch}>
        <span>Отображать:</span>
        {[20, 40].map((val) => (
          <button
            key={val}
            type="button"
            className={`${styles.limitBtn} ${filters.limit === val ? styles.active : ""}`}
            onClick={() => updateFilters({ limit: val, page: 1 })}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Переключатель вида Grid/List */}
      <div className={styles.viewSwitch}>
        <button
          type="button"
          className={`${viewMode === "grid" ? styles.active : ""} ${styles.viewStyle}`}
          onClick={() => setViewMode("grid")}
          title="Плиткой"
        >
          <LuLayoutGrid />
        </button>
        <button
          type="button"
          className={`${viewMode === "list" ? styles.active : ""} ${styles.viewStyle}`}
          onClick={() => setViewMode("list")}
          title="Списком"
        >
          <LuLayoutList />
        </button>
      </div>
    </div>
  );
};
