import React from "react";
import { Link } from "react-router";
import { type SiteCategory } from "../../model/types";
import styles from "./CategoryCard.module.scss"; // Используем Sass Modules

interface CategoryCardProps {
  category: SiteCategory;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { name, slug, motorcyclesCount } = category;

  const isReady = slug === "motorcycles";

  const localImage = `/public/${slug}.jpg`;

  return (
    <Link
      to={`/catalog/${slug}`}
      className={`${styles.CategoryCard} ${!isReady ? styles.notReady : ""}`}
    >
      <div className={styles.imageWrapper}>
        <img src={localImage} alt={name} className={styles.image} />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>{name}</h2>
        <p className={styles.status}>
          {isReady ? `${motorcyclesCount} моделей` : "Раздел в разработке"}
        </p>
      </div>
    </Link>
  );
};
