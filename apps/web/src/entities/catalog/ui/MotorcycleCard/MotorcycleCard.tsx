import React from "react";
import { Link } from "react-router";
import { type MotorcycleShort } from "../../model/types";
import styles from "./MotorcycleCard.module.scss";

export const MotorcycleCard: React.FC<{ data: MotorcycleShort }> = ({
  data,
}) => {
  return (
    <Link
      to={`/catalog/motorcycles/${data.brandSlug}/${data.slug}`}
      className={styles.Card}
    >
      <div className={styles.imageBox}>
        <img src={data.mainImage} alt={data.model} className={styles.img} />
        {data.rating > 4.5 && <span className={styles.badge}>Top Rated</span>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.model}>{data.model}</h3>
        <div className={styles.specs}>
          <span>{data.year} г.</span>
          <span>{data.displacement} см³</span>
        </div>
        <div className={styles.footer}>
          <span className={styles.price}>{data.price.toLocaleString()} ₽</span>
          <span className={styles.rating}>★ {data.rating}</span>
        </div>
      </div>
    </Link>
  );
};
