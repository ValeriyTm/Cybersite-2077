import React from "react";
import { Link } from "react-router";
import { type Brand } from "../../model/types";
import styles from "./BrandCard.module.scss";

interface BrandCardProps {
  brand: Brand;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const { name, country, slug, motorcyclesCount } = brand;

  return (
    <Link to={`/catalog/motorcycles/${slug}`} className={styles.BrandCard}>
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.info}>
          <span className={styles.country}>{country}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.count}>{motorcyclesCount} моделей</span>
        </div>
      </div>
    </Link>
  );
};
