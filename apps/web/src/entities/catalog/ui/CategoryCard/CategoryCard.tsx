//Роутинг:
import { Link } from "react-router";
//Типы:
import { type SiteCategory } from "@/entities/catalog/model";
//Стили:
import styles from "./CategoryCard.module.scss";

interface CategoryCardProps {
  category: SiteCategory;
}

export const CategoryCard = ({ category }: CategoryCardProps) => {
  const { name, slug, motorcyclesCount } = category;

  const isReady = slug === "motorcycles";

  const localImage = `src/shared/assets/images/catalog/${slug}.jpg`; //Адрес на фронтенде

  return (
    <Link
      to={`/catalog/${slug}`}
      className={`${styles.CategoryCard} ${!isReady ? styles.notReady : ""}`}
      onClick={(e) => { !isReady && e.preventDefault() }}
    >
      <article>
        <div className={styles.imageWrapper}>
          <img src={localImage} alt={name} className={styles.image} width='370'
            height='418' />
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{name}</h2>
          <p className={styles.status}>
            {isReady ? `${motorcyclesCount} моделей` : "Раздел в разработке"}
          </p>
        </div>
      </article>
    </Link>
  );
};
