import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";

// API & Global:
import { $api } from "@/shared/api";
import { API_URL } from "@/shared/api";

// Сущности и Фичи:
import { useMotorcycleFilters, useCatalogStore, type MotorcycleResponse } from "@/entities/catalog";
import { MotorcycleCardWidget } from "@/widgets/MotorcycleCardWidget"; // Используем наш правильный FSD-виджет карточки
import { RangeFilter, SelectFilter } from "@/features/catalog-filter";

// Shared UI и кастомные хуки:
import { Breadcrumbs, Pagination } from "@/shared/ui"; // Подключили универсальную пагинацию
import { useUrlSearch } from "@/shared/lib/hooks/useUrlSearch"; // Подключили наш хук поиска
import { LuLayoutGrid, LuLayoutList } from "react-icons/lu";

import styles from "./MotorcyclesPage.module.scss";

// 1. ВЫНЕСЛИ СТАТИЧЕСКИЕ КОНСТАНТЫ НАВЕРХ (не пересоздаются в памяти)
const CATEGORY_OPTIONS = [
  { value: "Allround", label: "Универсальный" },
  { value: "ATV", label: "Квадроцикл" },
  { value: "Classic", label: "Классический" },
  { value: "Cross / motocross", label: "Кросс/Мотокросс" },
  { value: "Custom / cruiser", label: "Кастом/Круизер" },
  { value: "Enduro / offroad", label: "Эндуро" },
  { value: "Minibike, cross", label: "Минибайк, кросс" },
  { value: "Minibike, sport", label: "Минибайк, спорт" },
  { value: "Naked bike", label: "Нейкед(стрит)" },
  { value: "Prototype / concept model", label: "Прототип/концепт" },
  { value: "Scooter", label: "Скутер" },
  { value: "Speedway", label: "Трековый" },
  { value: "Sport", label: "Спортбайк" },
  { value: "Sport touring", label: "Спорт-туринг" },
  { value: "Super motard", label: "Супермото" },
  { value: "Touring", label: "Туристический" },
  { value: "Trial", label: "Trial" },
  { value: "Unspecified category", label: "Не классифицировано" },
];

const TRANSMISSION_OPTIONS = [
  { value: "Chain", label: "Цепь" },
  { value: "Belt", label: "Ремень" },
  { value: "Cardan", label: "Кардан" },
];

export const MotorcyclesPage = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const { filters, updateFilters } = useMotorcycleFilters();
  const { viewMode, setViewMode } = useCatalogStore();
  const [isOpen, setIsOpen] = useState(false);

  // Используем наш универсальный хук поиска (он сам свяжет инпут с URL)
  const { searchQuery, debouncedSearch } = useUrlSearch("search", 500);

  const toggleFilter = () => setIsOpen(!isOpen);

  // Запрос данных
  const { data, isLoading } = useQuery({
    queryKey: ["motorcycles", brandSlug, filters],
    queryFn: () => $api
      .get<MotorcycleResponse>(`catalog/motorcycles/`, {
        params: { ...filters, brandSlug },
      })
      .then((res) => res.data),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  // Вынесли расчет SEO и крошек в начало рендера (чистота)
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog" },
    { label: "Бренды", href: "/catalog/motorcycles" },
    {
      label: brandSlug === 'all' ? 'Поиск' : brandSlug?.toUpperCase() ?? '',
      href: `/catalog/motorcycles/${brandSlug}`
    },
  ];

  const canonicalUrl = `${API_URL}/catalog/motorcycles/${brandSlug}`;
  const seoTitle = `Cybersite-2077 | Каталог мотоциклов ${brandSlug?.toUpperCase()}: все модели и поколения`;
  const seoDescription = `Полный список моделей с техническими характеристиками, фото и ценами. Найдено моделей: ${data?.total || 0}.`;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className={styles.Page}>
        {/* Сайдбар с фильтрами */}
        <aside className={isOpen ? styles.SidebarMobile : styles.Sidebar}>
          <div className={styles.exitSidebar} onClick={toggleFilter}>x</div>
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

          <button className={styles.filterMobileBtn} onClick={toggleFilter} type="button">Применить</button>
        </aside>

        {/* Основной контент */}
        <main className={styles.Content}>
          <Breadcrumbs items={breadcrumbs} />

          <h1 className={styles.title}>
            {brandSlug === "all" ? `Результаты поиска: "${filters.search}"` : `Мотоциклы ${brandSlug?.toUpperCase()}`}
          </h1>
          <h5>Найдено моделей: {data?.total || 0}</h5>

          <header className={styles.topBar}>
            {/* Поиск по модели */}
            <div className={styles.searchWrapper}>
              <label htmlFor="moto-search" className="visually-hidden">Поиск по модели</label>
              <input
                type="search"
                id='moto-search'
                placeholder="Поиск по модели (напр. CBR 1000)..."
                className={styles.searchInput}
                defaultValue={filters.search}
                onChange={(e) => debouncedSearch(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>

            {/* Сортировка */}
            <div className={styles.sorting}>
              <label className={styles.sortLabel} htmlFor="sorting-select">Сортировать:</label>
              <select className={styles.sortSelect} value={filters.sortBy} id='sorting-select' onChange={(e) => updateFilters({ sortBy: e.target.value })}>
                <option value="name_asc">По алфавиту (А-Я)</option>
                <option value="name_desc">По алфавиту (Я-А)</option>
                <option value="price_asc">Сначала дешевые</option>
                <option value="price_desc">Сначала дорогие</option>
                <option value="year_desc">Сначала новые</option>
                <option value="rating_desc">Высокий рейтинг</option>
              </select>
            </div>

            {/* Отображение лимитов и вида */}
            <div className={styles.displayControls}>
              <div className={styles.limitSwitch}>
                <span>Отображать:</span>
                {[20, 40].map((val) => (
                  <button key={val} className={`${styles.limitBtn} ${filters.limit === val ? styles.active : ""}`} onClick={() => updateFilters({ limit: val, page: 1 })}>
                    {val}
                  </button>
                ))}
              </div>

              <div className={styles.viewSwitch}>
                <button className={`${viewMode === "grid" ? styles.active : ""} ${styles.viewStyle}`} onClick={() => setViewMode("grid")} title="Плиткой">
                  <LuLayoutGrid />
                </button>
                <button className={`${viewMode === "list" ? styles.active : ""} ${styles.viewStyle}`} onClick={() => setViewMode("list")} title="Списком">
                  <LuLayoutList />
                </button>
              </div>
            </div>
          </header>

          <div>
            <button className={styles.mobileBtn} type="button" onClick={toggleFilter}>Фильтры 🔍</button>
          </div>

          {isLoading && <div className={styles.loadingOverlay}>Обновление...</div>}

          {/* Сетка карточек — переключает класс grid/list, а стилизацию карточки делает сам виджет */}
          <div className={viewMode === "grid" ? styles.grid : styles.list}>
            {data?.items?.map((moto) => (
              <MotorcycleCardWidget key={moto.id} data={moto} viewMode={viewMode} />
            ))}

            {!isLoading && data?.items?.length === 0 && (
              <div className={styles.empty}>Ничего не найдено по вашему запросу</div>
            )}
          </div>

          {/* 2.3. НАША УНИВЕРСАЛЬНАЯ ПАГИНАЦИЯ В ОДНУ СТРОКУ */}
          <Pagination
            currentPage={filters.page}
            totalPages={data?.pages || 1}
            onPageChange={(page) => updateFilters({ page })}
          />
        </main>
      </div>
    </>
  );
};
