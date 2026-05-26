import { useState } from "react";
//Работа с параметрами:
import { useParams } from "react-router";
//Состояния:
import { useMotorcycleFilters, useCatalogStore, type MotorcycleShort, type MotorcycleResponse, CATEGORY_OPTIONS, TRANSMISSION_OPTIONS, useCatalogMotorcycles } from "@/entities/catalog";
//Дебаунс для поиска:
import { useUrlSearch } from "@/shared/lib/hooks/useUrlSearch";
//Компоненты:
import { MotorcycleCard } from "@/widgets/MotorcycleCard";
import { RangeFilter, SelectFilter } from "@/features/catalog-filter";
import { Breadcrumbs, Button, Input, Pagination } from "@/shared/ui";
import { LuLayoutGrid, LuLayoutList } from "react-icons/lu";
//API:
import { API_URL } from "@/shared/api";
//SEO:
import { Helmet } from "react-helmet-async";
//Стили:
import styles from "./MotorcyclesPage.module.scss";
import { ProductFiltersSidebar } from "@/widgets/ProductFiltersSidebar";

export const MotorcyclesPage = () => {
  //Извлекаем данные из адресной строки:
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const { slug } = useParams<{ slug: string }>();
  //Фильтры из URL:
  const { filters, updateFilters } = useMotorcycleFilters();
  //Получаем UI-настройки (какой тип отображения карточек выбран) из Zustand:
  const { viewMode, setViewMode } = useCatalogStore();

  //Для фильтров на мобилке:
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = () => {
    setIsOpen(!isOpen);
  };

  //Debounce для поиска:
  const { searchQuery, debouncedSearch } = useUrlSearch("search", 500);

  //Данные о моделях мотоциклов с учетом фильтров:
  const { data, isLoading } = useCatalogMotorcycles({ brandSlug, filters });

  //--------------------------------------------------------------------//
  //Хлебные крошки (навигация):
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog" },
    { label: "Бренды", href: "/catalog/motorcycles" },
    {
      label: brandSlug === 'all' ? 'Поиск' : brandSlug?.toUpperCase() ?? '',
      href: `/catalog/motorcycles/${brandSlug}`,
    }, //Текущая страница
  ];

  //---------------------------------SEO:-----------------------//
  const canonicalUrl = `${API_URL}/catalog/motorcycles/${brandSlug}`;
  const seoTitle = `Cybersite-2077 | Каталог мотоциклов ${brandSlug?.toUpperCase()}: все модели и поколения`;
  const seoDescription = `Полный список моделей ${slug?.toUpperCase()} с техническими характеристиками, фото и ценами. Найдено моделей: ${data?.total || 0}.`;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className={styles.Page}>
        {/*1) Сайдбар с фильтрами:*/}
        <ProductFiltersSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

        {/*2) Карточки и сортировка:*/}
        <main className={styles.Content}>

          {/*2.0. Навигация:*/}
          <Breadcrumbs items={breadcrumbs} />

          <h1 className={styles.title}>
            {brandSlug === "all"
              ? `Результаты поиска: "${filters.search}"`
              : `Мотоциклы ${brandSlug?.toUpperCase()}`}
          </h1>
          <h5>Найдено моделей: {data?.total || 0}</h5>
          {/*2.1.Topbar:*/}
          <header className={styles.topBar}>
            {/*2.1.1.Поиск:*/}
            <div className={styles.searchWrapper}>
              <label htmlFor="moto-search" className="visually-hidden">Поиск по модели</label>
              <Input
                id="moto-search"
                type="search"
                placeholder="🔍 Поиск по модели (напр. CBR 1000)..."
                defaultValue={searchQuery}
                onChange={(e) => debouncedSearch(e.target.value)}
                label="Поиск по модели"
                visuallyHidden
                variant='dark'
              />
            </div>

            {/*2.1.2.Сортировка*/}
            <div className={styles.sorting}>
              <label className={styles.sortLabel} htmlFor="sorting-select">Сортировать:</label>
              <select
                className={styles.sortSelect}
                value={filters.sortBy}
                id='sorting-select'
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
                  className={`${viewMode === "grid" ? styles.active : ""} ${styles.viewStyle}`}
                  onClick={() => setViewMode("grid")}
                  title="Плиткой"
                >
                  <LuLayoutGrid />
                </button>
                <button
                  className={`${viewMode === "list" ? styles.active : ""} ${styles.viewStyle}`}
                  onClick={() => setViewMode("list")}
                  title="Списком"
                >
                  <LuLayoutList />
                </button>
              </div>
            </div>
          </header>

          {/*Кнопка фильтров на мобилке:*/}
          {/* <div>
            <button className={styles.mobileBtn} type="button" onClick={toggleFilter}>
              Фильтры 🔍
            </button>
          </div> */}
          {/* Кнопка фильтров на мобилке */}
          <div className={styles.mobileBtnWrapper}>
            <Button
              type="button"
              variant="outline-dark"
              onClick={toggleFilter}
            >
              ФИЛЬТРЫ 🔍
            </Button>
          </div>


          {/*2.2.Карточки:*/}
          {isLoading && (
            <div className={styles.loadingOverlay}>Обновление...</div>
          )}
          <div className={viewMode === "grid" ? styles.grid : styles.list}>
            {data?.items?.map((moto: MotorcycleShort) => {
              return (
                <MotorcycleCard key={moto.id} moto={moto} viewMode={viewMode} />
              );
            })}

            {/* Если ничего не нашли: */}
            {!isLoading && data?.items?.length === 0 && (
              <div className={styles.empty}>
                Ничего не найдено по вашему запросу
              </div>
            )}
          </div>

          {/*2.3.Пагинация:*/}
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
