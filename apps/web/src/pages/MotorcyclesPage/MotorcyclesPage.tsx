import React from "react";
import { useParams } from "react-router";
import { fetchMotorcycles, MotorcycleCard } from "@/entities/catalog";
import { RangeFilter } from "@/features/catalog-filter/ui/RangeFilter/RangeFilter";
import styles from "./MotorcyclesPage.module.scss";
import { SelectFilter } from "@/features/catalog-filter/ui/SelectFilter/SelectFilter";
import debounce from "lodash/debounce";
//Компонент Breadcrumbs:
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { useMotorcycleFilters } from "@/entities/catalog/lib/useMotorcycleFilters";
import { useCatalogStore } from "@/entities/catalog/model/useCatalogStore";
import { useQuery } from "@tanstack/react-query";
import { LuLayoutGrid, LuLayoutList } from "react-icons/lu";
//Для SEO:
import { Helmet } from "react-helmet-async";

export const MotorcyclesPage = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();

  const { slug } = useParams<{ slug: string }>();

  //Фильтры из URL:
  const { filters, updateFilters } = useMotorcycleFilters();
  //Получаем UI-настройки из Zustand:
  const { viewMode, setViewMode } = useCatalogStore();

  //Кэширование и состояние загрузки из react query:
  const { data, isLoading } = useQuery({
    queryKey: ["motorcycles", brandSlug, filters],
    queryFn: () => fetchMotorcycles({ brandSlug, ...filters }),
    // Магия: при переключении страниц старые данные не пропадают мгновенно (нет мерцания)
    placeholderData: (previousData) => previousData,
    // Кэшируем результат на 5 минут, чтобы при кнопке "Назад" всё было мгновенно
    staleTime: 5 * 60 * 1000,
  });

  // Опции для категорий:
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

  const breadcrumbs = [
    { label: "Каталог", href: "/catalog/motorcycles" },
    { label: slug === "all" ? "Поиск по всему каталогу" : slug?.toUpperCase() },
    {
      label: brandSlug?.toUpperCase(),
      href: `/catalog/motorcycles/${brandSlug}`,
    }, // Текущая страница
  ];

  //--------Debounce для поиска (дебаунс для фильтров зашит в комоненте фильтра):--------
  const debouncedSearch = React.useMemo(
    () =>
      debounce((value: string) => {
        updateFilters({ search: value, page: 1 }); // Обновляем URL спустя 500мс
      }, 500),
    [updateFilters], // Зависимость от функции обновления
  );

  // Очистка при размонтировании (хорошая практика)
  React.useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  //-------------SEO:-----------------------//
  const seoTitle = `Каталог мотоциклов ${brandSlug?.toUpperCase()}: все модели и поколения | CyberBike`;
  const seoDescription = `Полный список моделей ${slug?.toUpperCase()} с техническими характеристиками, фото и ценами. Найдено моделей: ${data?.total || 0}.`;

  return (
    <div className={styles.Page}>
      {/*1) Сайдбар с фильтрами:*/}
      <aside className={styles.Sidebar}>
        {/*Тут фильтры:*/}
        <h2 className={styles.sidebarTitle}>Фильтры</h2>

        {/*Фильтр по цене:*/}
        <RangeFilter
          label="Цена (₽)"
          min={filters.minPrice}
          max={filters.maxPrice}
          onChange={(min, max) =>
            updateFilters({ minPrice: min, maxPrice: max })
          }
        />

        {/*Фильтр по объему двигателя:*/}
        <RangeFilter
          label="Объем (см³)"
          min={filters.minDisplacement}
          max={filters.maxDisplacement}
          onChange={(min, max) =>
            updateFilters({ minDisplacement: min, maxDisplacement: max })
          }
        />

        {/*Фильтр по году выпуска:*/}
        <RangeFilter
          label="Год выпуска"
          min={filters.minYear}
          max={filters.maxYear}
          onChange={(min, max) => updateFilters({ minYear: min, maxYear: max })}
        />

        {/*Фильтр по мощности:*/}
        <RangeFilter
          label="Мощность (л.с.)"
          min={filters.minPower}
          max={filters.maxPower}
          onChange={(min, max) =>
            updateFilters({ minPower: min, maxPower: max })
          }
        />

        {/*Фильтр по категории:*/}
        <SelectFilter
          label="Категория"
          value={filters.category}
          options={CATEGORY_OPTIONS}
          onChange={(val) => updateFilters({ category: val })}
        />

        {/*Фильтр по трансмиссии:*/}
        <SelectFilter
          label="Тип привода"
          value={filters.transmission}
          options={TRANSMISSION_OPTIONS}
          onChange={(val) => updateFilters({ transmission: val })}
        />
      </aside>

      {/*2) Карточки и сортировка:*/}
      <main className={styles.Content}>
        <Helmet>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />
        </Helmet>

        <Breadcrumbs items={breadcrumbs} />
        {/* <h1 className={styles.title}>Мотоциклы {brandSlug?.toUpperCase()}</h1> */}
        <h1 className={styles.title}>
          {slug === "all"
            ? `Результаты поиска: ${filters.search}`
            : `Мотоциклы ${brandSlug?.toUpperCase()}`}
        </h1>
        <h3>Найдено моделей: {data?.total || 0}</h3>
        {/*2.1.Topbar:*/}
        <header className={styles.topBar}>
          {/*2.1.1.Поиск:*/}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Поиск по модели (напр. CBR 1000)..."
              className={styles.searchInput}
              defaultValue={filters.search}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          {/*2.1.2.Сортировка*/}
          <div className={styles.sorting}>
            <span className={styles.sortLabel}>Сортировать:</span>
            <select
              className={styles.sortSelect}
              value={filters.sortBy}
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

          {/*2.1.3.Переключатели режима отображения:*/}
          <div className={styles.displayControls}>
            {/*Переключатель лимита: */}
            <div className={styles.limitSwitch}>
              <span>Отображать:</span>
              {[20, 40].map((val) => (
                <button
                  key={val}
                  className={`${styles.limitBtn} ${filters.limit === val ? styles.active : ""}`}
                  onClick={() => updateFilters({ limit: val, page: 1 })}
                >
                  {val}
                </button>
              ))}
            </div>

            {/*Переключатель вида Grid/List: */}
            <div className={styles.viewSwitch}>
              <button
                className={viewMode === "grid" ? styles.active : ""}
                onClick={() => setViewMode("grid")}
                title="Плиткой"
              >
                <LuLayoutGrid /> {/* Твоя иконка сетки */}
              </button>
              <button
                className={viewMode === "list" ? styles.active : ""}
                onClick={() => setViewMode("list")}
                title="Списком"
              >
                <LuLayoutList /> {/* Твоя иконка списка */}
              </button>
            </div>
          </div>
        </header>

        {/*2.2.Карточки:*/}
        {isLoading && (
          <div className={styles.loadingOverlay}>Обновление...</div>
        )}
        <div className={viewMode === "grid" ? styles.grid : styles.list}>
          {/* Мапим data.items вместо старого стейта items */}
          {data?.items?.map((moto) => (
            <MotorcycleCard key={moto.id} data={moto} viewMode={viewMode} />
          ))}

          {/* Если ничего не нашли */}
          {!isLoading && data?.items?.length === 0 && (
            <div className={styles.empty}>
              Ничего не найдено по вашему запросу
            </div>
          )}
        </div>

        {/*2.3.Пагинация:*/}
        {data?.pages && data.pages > 1 && (
          <footer className={styles.pagination}>
            {/*Кнопка "в самое начало":*/}
            <button
              className={styles.navBtn}
              disabled={filters.page === 1}
              onClick={() => updateFilters({ page: 1 })}
              title="В начало"
            >
              &laquo;&laquo;
            </button>

            {/*Кнопка "на одну назад": */}
            <button
              className={styles.navBtn}
              disabled={filters.page === 1}
              onClick={() => updateFilters({ page: filters.page - 1 })}
            >
              &laquo;
            </button>

            {/*Отображение числа страниц:*/}
            <div className={styles.numbers}>
              {(() => {
                const pages = [];
                const maxButtons = 5;
                const totalPages = data?.pages || 1;

                let startPage = Math.max(1, filters.page - 2);
                let endPage = Math.min(totalPages, startPage + maxButtons - 1);

                if (endPage - startPage < maxButtons - 1) {
                  startPage = Math.max(1, endPage - maxButtons + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => updateFilters({ page: i })}
                      className={`${styles.pageBtn} ${filters.page === i ? styles.active : ""}`}
                    >
                      {i}
                    </button>,
                  );
                }
                return pages;
              })()}
            </div>

            {/*Кнопка "на одну вперед":*/}
            <button
              className={styles.navBtn}
              // Берем totalPages прямо из данных React Query
              disabled={filters.page === (data?.pages || 1)}
              onClick={() => updateFilters({ page: filters.page + 1 })}
            >
              &raquo;
            </button>

            {/*Кнопка "в самый конец":*/}
            <button
              className={styles.navBtn}
              disabled={filters.page === (data?.pages || 1)}
              onClick={() => updateFilters({ page: data?.pages || 1 })}
              title="В конец"
            >
              &raquo;&raquo;
            </button>
          </footer>
        )}
      </main>
    </div>
  );
};
