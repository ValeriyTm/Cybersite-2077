//Состояния и опции:
import { CATEGORY_OPTIONS, TRANSMISSION_OPTIONS, useMotorcycleFilters } from "@/entities/catalog";
//Компоненты:
import { RangeFilter, SelectFilter } from "@/features/catalog";
import { Button } from "@/shared/ui";
//Стили:
import styles from "./ProductFiltersSidebar.module.scss";


interface ProductFiltersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductFiltersSidebar = ({ isOpen, onClose }: ProductFiltersSidebarProps) => {
  const { filters, updateFilters } = useMotorcycleFilters();

  return (
    <aside className={isOpen ? styles.SidebarMobile : styles.Sidebar}>
      <div className={styles.exitSidebar} onClick={onClose}>x</div>
      <h2 className={styles.sidebarTitle}>Фильтры</h2>

      <RangeFilter label="Цена (₽)" min={filters.minPrice} max={filters.maxPrice} onChange={(min, max) => updateFilters({ minPrice: min, maxPrice: max })} />
      <RangeFilter label="Объем (см³)" min={filters.minDisplacement} max={filters.maxDisplacement} onChange={(min, max) => updateFilters({ minDisplacement: min, maxDisplacement: max })} />
      <RangeFilter label="Год выпуска" min={filters.minYear} max={filters.maxYear} onChange={(min, max) => updateFilters({ minYear: min, maxYear: max })} />
      <RangeFilter label="Мощность (л.с.)" min={filters.minPower} max={filters.maxPower} onChange={(min, max) => updateFilters({ minPower: min, maxPower: max })} />

      <SelectFilter label="Категория" value={filters.category} options={CATEGORY_OPTIONS} onChange={(val) => updateFilters({ category: val })} />
      <SelectFilter label="Тип привода" value={filters.transmission} options={TRANSMISSION_OPTIONS} onChange={(val) => updateFilters({ transmission: val })} />

      <label className={styles.checkboxFilter}>
        <input type="checkbox" checked={filters.onlyInStock} onChange={(e) => updateFilters({ onlyInStock: e.target.checked })} />
        <span className={styles.checkboxLabel}>Только в наличии</span>
      </label>

      <Button
        type="button"
        variant="outline-dark"
        onClick={onClose}
      >
        Применить
      </Button>
    </aside>
  );
};
