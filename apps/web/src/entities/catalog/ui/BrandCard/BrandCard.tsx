//Роутинг:
import { Link } from "react-router";
//Типы:
import { type Brand } from "../../model/types";
//API:
import { API_URL } from "@/shared/api/api";
//Стили:
import styles from "./BrandCard.module.scss";
interface BrandCardProps {
  brand: Brand;
}

const server = `${API_URL}/static/brands`;

export const BrandCard = ({ brand }: BrandCardProps) => {
  const { name, country, slug, motorcyclesCount, image } = brand;

  const imagePath = `${server}/${image}`;

  return (
    <Link to={`/catalog/motorcycles/${slug}`} className={styles.BrandCard}>
      <div className={styles.content}>
        <div className={styles.text}>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.country}>{country}</p>
          <div className={styles.info}>
            <p>
              <span className={styles.dot}>•</span>
              <span className={styles.count}>
                {motorcyclesCount} моделей(и)
              </span>
            </p>
          </div>
        </div>
        {image && (
          <div className={styles.frame}>
            <img src={imagePath} loading="lazy" decoding="async" alt="brand-logo" className={styles.logo} />
          </div>
        )}
      </div>
    </Link>
  );
};
