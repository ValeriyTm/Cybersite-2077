import {
  fetchSiteCategories,
  type SiteCategory,
  CategoryCard,
} from "@/entities/catalog";
//Состояния:
import { useEffect, useState } from "react";
//API:
import { API_URL } from "@/shared/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { Breadcrumbs } from "@/shared/ui";
//Стили:
import styles from "./CatalogPage.module.scss";

export const CatalogPage = () => {
  const [categories, setCategories] = useState<SiteCategory[]>([]);

  useEffect(() => {
    fetchSiteCategories().then(setCategories);
  }, []);

  //SEO:
  const canonicalUrl = `${API_URL}/catalog`;

  //Хлебные крошки:
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog" }, // Текущая страница
  ];

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
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </main>

    </>
  );
};
