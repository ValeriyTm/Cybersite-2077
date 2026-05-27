import { useState } from "react";
//Работа с параметрами:
import { useParams } from "react-router";
//Состояния:
import { useMotorcycleFilters, useCatalogStore, type MotorcycleShort, useCatalogMotorcycles } from "@/entities/catalog";
//Дебаунс для поиска:
import { useUrlSearch } from "@/shared/lib/hooks/useUrlSearch";
//Компоненты:
import { MotorcycleCard } from "@/widgets/MotorcycleCard";
import { CatalogDisplayControls, CatalogSorting } from "@/features/catalog";
import { Breadcrumbs, Button, Input, Pagination } from "@/shared/ui";
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
  const { viewMode } = useCatalogStore();

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
  const canonicalUrl = `${import.meta.env.VITE_SITE_URL}/catalog/motorcycles/${brandSlug}`;
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
            <CatalogSorting />

            {/*2.1.3.Переключатели режима отображения:*/}
            <CatalogDisplayControls />
          </header>

          {/*Кнопка фильтров на мобилке:*/}
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
