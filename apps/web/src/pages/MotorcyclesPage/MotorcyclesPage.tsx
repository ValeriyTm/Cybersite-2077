import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { fetchMotorcycles, MotorcycleCard } from "@/entities/catalog";
import { type MotorcycleShort } from "@/entities/catalog/model/types";
import { RangeFilter } from "@/features/catalog-filter/ui/RangeFilter/RangeFilter";
import styles from "./MotorcyclesPage.module.scss";
import { SelectFilter } from "@/features/catalog-filter/ui/SelectFilter/SelectFilter";
import debounce from "lodash/debounce";

export const MotorcyclesPage: React.FC = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const [items, setItems] = useState<MotorcycleShort[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  //Состояние всех фильтров:
  const [filters, setFilters] = useState({
    page: 1,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minYear: undefined as number | undefined,
    maxYear: undefined as number | undefined,
    minDisplacement: undefined as number | undefined,
    maxDisplacement: undefined as number | undefined,
    minPower: undefined as number | undefined,
    maxPower: undefined as number | undefined,
    category: undefined as string | undefined,
    transmission: undefined as string | undefined,
    minRating: undefined as number | undefined,
    sortBy: "name_asc" as string,
  });

  // 2. Функция загрузки (вынесена отдельно для дебаунса)
  const loadData = async (currentFilters: typeof filters) => {
    if (!brandSlug) return;
    setIsLoading(true);
    try {
      const res = await fetchMotorcycles({
        brandSlug: brandSlug,
        ...currentFilters,
      });
      // Проверяем, что в ответе ЕСТЬ items, прежде чем их сетить 🎯
      if (res && Array.isArray(res.items)) {
        setItems(res.items);
        setTotalPages(res.pages);
      } else {
        setItems([]); // Если данных нет — очищаем список
      }

      console.log("Всего моделей:", res.total);
      console.log("Всего страниц:", res.pages);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      setItems([]); // В случае ошибки тоже ставим пустой массив
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Создаем "отложенную" версию загрузки ⏳
  const debouncedLoad = React.useCallback(
    debounce((f: typeof filters) => loadData(f), 500),
    [brandSlug],
  );

  // 4. Следим за изменением фильтров
  useEffect(() => {
    debouncedLoad(filters);
    // При размонтировании отменяем отложенный вызов
    return () => debouncedLoad.cancel();
  }, [filters, debouncedLoad]);

  // Логика обновления фильтров
  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Хендлер смены страницы
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // console.log(
  //   "IDs в текущем списке:",
  //   items.map((m) => m.id),
  // );
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
          onChange={(min, max) => {
            setFilters((prev) => ({
              ...prev,
              minPrice: min,
              maxPrice: max,
              page: 1,
            }));
          }}
          // step={1000}
        />

        {/*Фильтр по объему двигателя:*/}
        <RangeFilter
          label="Объем (см³)"
          min={filters.minDisplacement}
          max={filters.maxDisplacement}
          onChange={(min, max) =>
            setFilters((prev) => ({
              ...prev,
              minDisplacement: min,
              maxDisplacement: max,
              page: 1,
            }))
          }
        />

        {/*Фильтр по году выпуска:*/}
        <RangeFilter
          label="Год выпуска"
          min={filters.minYear} // 👈 Убедись, что в useState есть minYear
          max={filters.maxYear} // 👈 И maxYear
          onChange={(min, max) =>
            setFilters((prev) => ({
              ...prev,
              minYear: min,
              maxYear: max,
              page: 1,
            }))
          }
        />

        {/*Фильтр по мощности:*/}
        <RangeFilter
          label="Мощность (л.с.)"
          min={filters.minPower}
          max={filters.maxPower}
          onChange={(min, max) =>
            setFilters((prev) => ({
              ...prev,
              minPower: min,
              maxPower: max,
              page: 1,
            }))
          }
        />

        {/*Фильтр по категории:*/}
        <SelectFilter
          label="Категория"
          value={filters.category}
          options={CATEGORY_OPTIONS}
          onChange={(val) => updateFilter("category", val)}
        />

        {/*Фильтр по трансмиссии:*/}
        <SelectFilter
          label="Тип привода"
          value={filters.transmission}
          options={TRANSMISSION_OPTIONS}
          onChange={(val) => updateFilter("transmission", val)}
        />
      </aside>

      {/*2) Карточки и сортировка:*/}
      <main className={styles.Content}>
        <h1 className={styles.title}>Мотоциклы {brandSlug?.toUpperCase()}</h1>
        {/*2.1.Сортировка:*/}
        <header className={styles.topBar}>
          <div className={styles.sorting}>
            <span className={styles.sortLabel}>Сортировать:</span>
            <select
              className={styles.sortSelect}
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
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
          {items?.map((moto) => (
            <MotorcycleCard key={moto.id} data={moto} />
          ))}
        </div>

        {/*2.3.Пагинация:*/}
        {totalPages > 1 && (
          <footer className={styles.pagination}>
            <button
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
              className={styles.navBtn}
            >
              &laquo;
            </button>

            <div className={styles.numbers}>
              {(() => {
                const pages = [];
                const maxButtons = 5; // Сколько максимум кнопок с цифрами мы хотим видеть

                // 1. Вычисляем начальную страницу
                let startPage = Math.max(1, filters.page - 2);

                // 2. Вычисляем конечную страницу
                let endPage = Math.min(totalPages, startPage + maxButtons - 1);

                // 3. Корректируем начало, если мы в самом конце списка
                if (endPage - startPage < maxButtons - 1) {
                  startPage = Math.max(1, endPage - maxButtons + 1);
                }

                // 4. Генерируем кнопки без дублей 🎯
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i} // Теперь ключ всегда уникален (1, 2, 3...)
                      onClick={() => handlePageChange(i)}
                      className={`${styles.pageBtn} ${filters.page === i ? styles.active : ""}`}
                    >
                      {i}
                    </button>,
                  );
                }
                return pages;
              })()}
            </div>

            <button
              disabled={filters.page === totalPages}
              onClick={() => handlePageChange(filters.page + 1)}
              className={styles.navBtn}
            >
              &raquo;
            </button>
          </footer>
        )}
      </main>
    </div>
  );
};
