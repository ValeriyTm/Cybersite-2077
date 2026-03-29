import React from "react";
import { Link } from "react-router";
import { type MotorcycleShort } from "../../model/types";
import styles from "./MotorcycleCard.module.scss";

const STATIC_URL = "http://localhost:3001/static";
const DEFAULT_IMG = `${STATIC_URL}/defaults/default-card-icon.jpg`;

export const MotorcycleCard: React.FC<{ data: MotorcycleShort }> = ({
  data,
}) => {
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return DEFAULT_IMG;

    // Если в базе путь "/defaults/...", просто добавляем домен
    if (path.startsWith("/")) {
      return `${STATIC_URL}${path}`;
    }

    // Если это просто имя файла (напр. "yamaha-r1.jpg"), ищем в папке motorcycles
    return `${STATIC_URL}/motorcycles/${path}`;
  };

  return (
    <Link
      to={`/catalog/motorcycles/${data.brandSlug}/${data.slug}`}
      className={styles.Card}
    >
      <div className={styles.imageBox}>
        <img
          src={getImageUrl(data.mainImage)}
          alt={data.model}
          className={styles.img}
          onError={(e) => {
            // Защитный механизм: если даже по очищенному пути 404
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = DEFAULT_IMG;
          }}
        />
        {data.rating > 4.7 && <span className={styles.badge}>Top Rated</span>}
      </div>

      <div className={styles.info}>
        <h3 className={styles.model}>{data.model}</h3>
        <div className={styles.specs}>
          <span>{data.year} г.</span>
          <span>{data.displacement} см³</span>
          <span>{data.power !== 0 ? `${data.power} л.с.` : ""}</span>
        </div>
        <div className={styles.footer}>
          <span className={styles.price}>{data.price.toLocaleString()} ₽</span>
          <span className={styles.rating}>★ {data.rating}</span>
        </div>
      </div>
    </Link>
  );
};
