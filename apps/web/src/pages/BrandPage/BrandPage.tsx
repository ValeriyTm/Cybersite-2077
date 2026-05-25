import { useSearchParams } from "react-router";
import { BrandCard, useBrands } from "@/entities/catalog";
//Компоненты:
import { Breadcrumbs, Input, Pagination } from "@/shared/ui";
//Хук для работы с дебаунсом:
import { useUrlSearch } from "@/shared/lib/hooks/useUrlSearch";
//API:
import { API_URL } from "@/shared/api";
//Типы:
import { type Brand } from '@/entities/catalog/model/types';
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./BrandPage.module.scss";

//Хлебные крошки:
const breadcrumbs = [
  { label: "Каталог", href: "/catalog" },
  { label: "Бренды", href: "/catalog/motorcycles" }, // Текущая страница
];

//SEO:
const canonicalUrl = `${API_URL}/catalog/motorcycles`;

export const BrandPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  //Извлекаем данные (номер страницы и поисковый запрос) из URL:
  const currentPage = Number(searchParams.get("page")) || 1;

  const { searchQuery, debouncedSearch } = useUrlSearch();

  //Получаем данные о брендах:
  const { data, isLoading } = useBrands({ page: currentPage, limit: 24, search: searchQuery });

  //Всего страниц:
  const totalPages = data?.pages || 1;

  //Вспомогательная функция для переключения страниц в пагинации:
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page)); // Просто меняем цифру страницы, не трогая поиск
    setSearchParams(params);
  };

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Мотобренды</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <main className={styles.BrandsPage}>

        <Breadcrumbs items={breadcrumbs} />

        <header className={styles.header}>
          <h1 className={styles.title}>Мировые бренды</h1>
          <p className={styles.subtitle}>Более 500 производителей в нашей базе</p>

          {/*Поле поиска */}
          <div className={styles.searchContainer}>
            <Input
              id="brand-search"
              type="search"
              placeholder="Найти бренд (напр. Honda)..."
              defaultValue={searchQuery} // Подтягивает значение из URL при первой загрузке
              onChange={(e) => debouncedSearch(e.target.value)}
              label="Поиск бренда"
              visuallyHidden
              variant='dark'
            />
          </div>
        </header>

        {/* Индикация загрузки */}
        {isLoading && !data && <div className={styles.loader}>Загрузка...</div>}

        {/* Карточки брендов: */}
        <div className={styles.grid}>
          {data?.items.map((brand: Brand) => {
            return (
              <BrandCard key={brand.id} brand={brand} />
            )
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
    </>
  );
};
