import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { fetchMotorcycles, MotorcycleCard } from "@/entities/catalog";
import { type MotorcycleShort } from "@/entities/catalog/model/types";
import { RangeFilter } from "@/features/catalog-filter/ui/RangeFilter/RangeFilter";
import styles from "./MotorcyclesPage.module.scss";
import { SelectFilter } from "@/features/catalog-filter/ui/SelectFilter/SelectFilter";
import debounce from "lodash/debounce";
//Компонент Breadcrumbs:
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { useMotorcycleFilters } from "@/entities/catalog/lib/useMotorcycleFilters";
import { useCatalogStore } from "@/entities/catalog/model/useCatalogStore";
import { useQuery } from "@tanstack/react-query";

export const MotorcyclesPage = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();

  //Фильтры из URL:
  const { filters, updateFilters } = useMotorcycleFilters();

  //Получаем UI-настройки из Zustand:
  const { viewMode, totalItems, setTotalItems } = useCatalogStore();

  //Кэширование и состояние загрузки из react query:
  const { data, isLoading } = useQuery({
    queryKey: ["motorcycles", brandSlug, filters],
    queryFn: () => fetchMotorcycles({ brandSlug, ...filters }),
    // Магия: при переключении страниц старые данные не пропадают мгновенно (нет мерцания)
    placeholderData: (previousData) => previousData,
    // Кэшируем результат на 5 минут, чтобы при кнопке "Назад" всё было мгновенно
    staleTime: 5 * 60 * 1000,
    // onSuccess: (res) => setTotalItems(res.total), // Синхронизируем кол-во со стором
  });

  // const [items, setItems] = useState<MotorcycleShort[]>([]);
  // const [isLoading, setIsLoading] = useState(false);
  // const [totalPages, setTotalPages] = useState(1);

  //Состояние всех фильтров:
  // const [filters, setFilters] = useState({
  //   page: 1,
  //   search: "",
  //   minPrice: undefined as number | undefined,
  //   maxPrice: undefined as number | undefined,
  //   minYear: undefined as number | undefined,
  //   maxYear: undefined as number | undefined,
  //   minDisplacement: undefined as number | undefined,
  //   maxDisplacement: undefined as number | undefined,
  //   minPower: undefined as number | undefined,
  //   maxPower: undefined as number | undefined,
  //   category: undefined as string | undefined,
  //   transmission: undefined as string | undefined,
  //   minRating: undefined as number | undefined,
  //   sortBy: "name_asc" as string,
  // });

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
    {
      label: brandSlug?.toUpperCase(),
      href: `/catalog/motorcycles/${brandSlug}`,
    }, // Текущая страница
  ];

  const handleSearch = debounce((value: string) => {
    updateFilters({ search: value });
  }, 500);

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
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Мотоциклы {brandSlug?.toUpperCase()}</h1>
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
              onChange={(e) => updateFilters({ search: e.target.value })}
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
        </header>

        {/*2.2.Карточки:*/}
        {isLoading && (
          <div className={styles.loadingOverlay}>Обновление...</div>
        )}
        <div className={styles.grid}>
          {/* Мапим data.items вместо старого стейта items 🎯 */}
          {data?.items?.map((moto) => (
            <MotorcycleCard key={moto.id} data={moto} />
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
            {/* 1. В самое начало 🎯 */}
            <button
              className={styles.navBtn}
              disabled={filters.page === 1}
              onClick={() => updateFilters({ page: 1 })}
              title="В начало"
            >
              &laquo;&laquo;
            </button>

            {/* 2. На одну назад */}
            <button
              className={styles.navBtn}
              disabled={filters.page === 1}
              onClick={() => updateFilters({ page: filters.page - 1 })}
            >
              &laquo;
            </button>

            {/* 3. Числа страниц (наш цикл из прошлого шага) */}
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

            {/* 4. На одну вперед */}
            <button
              className={styles.navBtn}
              // Берем totalPages прямо из данных React Query
              disabled={filters.page === (data?.pages || 1)}
              onClick={() => updateFilters({ page: filters.page + 1 })}
            >
              &raquo;
            </button>

            {/* 5. В самый конец 🎯 */}
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
