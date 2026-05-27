import {
  CategoryCard,
  useSiteCategories,
} from "@/entities/catalog";
//Состояния:
import { type ProductCategory } from "@repo/types";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { Breadcrumbs } from "@/shared/ui";
//Изображения:
import { CATEGORY_IMAGES } from "./models/categories";
//Стили:
import styles from "./CatalogPage.module.scss";

//Хлебные крошки:
const breadcrumbs = [
  { label: "Каталог", href: "/catalog" }, // Текущая страница
];

export const CatalogPage = () => {

  const { data: categories = [], isLoading, isError } = useSiteCategories();


  //SEO:
  const canonicalUrl = `${import.meta.env.VITE_SITE_URL}/catalog`;

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>Загрузка...</div>
    );

  if (isError) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        Ошибка при загрузке категорий. Попробуйте позже.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Каталог</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <main className={styles.CatalogPage}>
        <Breadcrumbs items={breadcrumbs} />

        <h1 className={styles.pageTitle}>Каталог техники</h1>
        <div className={styles.grid}>
          {categories.map((cat: ProductCategory) => {
            return (
              <CategoryCard key={cat.id} category={cat} img={CATEGORY_IMAGES[cat.slug]} />
            )
          })}
        </div>
      </main>

    </>
  );
};
