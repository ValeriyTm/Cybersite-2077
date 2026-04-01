import { Link } from "react-router";
import { type MotorcycleShort } from "../../model/types";
import styles from "./MotorcycleCard.module.scss";

const STATIC_URL = "http://localhost:3001/static";
const DEFAULT_IMG = `${STATIC_URL}/defaults/default-card-icon.jpg`;

export interface MotorcycleCardProps {
  data: MotorcycleShort;
  viewMode?: "grid" | "list";
}

export const MotorcycleCard = ({
  data,
  viewMode = "grid",
}: MotorcycleCardProps) => {
  //Определяем какое изображение ставить:
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return DEFAULT_IMG;
    // Если в базе путь "/defaults/...", просто добавляем домен
    if (path.startsWith("/")) {
      return `${STATIC_URL}${path}`;
    }
    //Если это просто имя файла ("yamaha-r1.jpg"), ищем в папке motorcycles:
    return `${STATIC_URL}/motorcycles/${path}`;
  };

  //Формируем динамический класс для всей карточки:
  const cardClassName = `${styles.Card} ${viewMode === "list" ? styles.listView : ""}`;

  return (
    <Link
      to={`/catalog/motorcycles/${data.brandSlug}/${data.slug}`}
      className={cardClassName}
    >
      {viewMode === "grid" && (
        <div className={styles.imageBox}>
          <img
            src={getImageUrl(data.mainImage)}
            alt={data.model}
            className={styles.img}
            onError={(e) => {
              //Реализуем защитный механизм: если даже по очищенному пути получаем ошибку 404
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = DEFAULT_IMG;
            }}
          />
          {data.rating > 4.7 && <span className={styles.badge}>Top Rated</span>}
        </div>
      )}

      <div className={styles.info}>
        <div className={styles.mainTitleGroup}>
          <h3 className={styles.model}>{data.model}</h3>
          {viewMode === "list" && (
            <span className={styles.listBrand}>{data.brand}</span>
          )}
        </div>

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
