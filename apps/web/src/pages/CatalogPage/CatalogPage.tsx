import { useEffect, useState } from "react";
import {
  fetchSiteCategories,
  type SiteCategory,
  CategoryCard,
} from "@/entities/catalog";
import styles from "./CatalogPage.module.scss";

export const CatalogPage = () => {
  const [categories, setCategories] = useState<SiteCategory[]>([]);

  useEffect(() => {
    fetchSiteCategories().then(setCategories);
  }, []);

  return (
    <main className={styles.CatalogPage}>
      <h1 className={styles.pageTitle}>Каталог техники</h1>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </main>
  );
};
