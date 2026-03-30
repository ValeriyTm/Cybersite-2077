import { Link } from "react-router";
import { type Brand } from "../../model/types";
import styles from "./BrandCard.module.scss";

interface BrandCardProps {
  brand: Brand;
}

const server = "http://localhost:3001/static/brands/";

export const BrandCard = ({ brand }: BrandCardProps) => {
  const { name, country, slug, motorcyclesCount, image } = brand;

  const imagePath = `${server}/${image}`;

  return (
    <Link to={`/catalog/motorcycles/${slug}`} className={styles.BrandCard}>
      <div className={styles.content}>
        <div>
          <h3 className={styles.name}>{name}</h3>
          <div className={styles.info}>
            <p className={styles.country}>{country}</p>
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
            <img src={imagePath} alt="brand-logo" className={styles.logo} />
          </div>
        )}
      </div>
    </Link>
  );
};
