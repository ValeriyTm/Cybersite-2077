import { Link } from "react-router";
import { type MotorcycleShort } from "../../model/types";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useFavorites } from "@/entities/trading/api/useFavorites";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { AddToCartButton } from "@/features/trading/ui/AddToCartButton/AddToCartButton";

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
  const isAuth = useAuthStore((state) => state.isAuth);

  //Определяем какое изображение ставить для отображения изображения:
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return DEFAULT_IMG;
    //Если в базе путь "/defaults/...", просто добавляем домен
    if (path.startsWith("/")) {
      return `${STATIC_URL}${path}`;
    }
    //Если это просто имя файла ("yamaha-r1.jpg"), ищем в папке motorcycles:
    return `${STATIC_URL}/motorcycles/${path}`;
  };

  //Определяем какое изображение ставить для передачи в корзину:
  const getImageUrlCart = (path: string | null | undefined) => {
    if (!path) return "";

    //Если это просто имя файла ("yamaha-r1.jpg"), ищем в папке motorcycles:
    return `${STATIC_URL}/motorcycles/${path}`;
  };

  //Формируем динамический класс для всей карточки:
  const cardClassName = `${styles.Card} ${viewMode === "list" ? styles.listView : ""}`;

  //-----
  // 1. Подключаем логику избранного
  const { toggleFavorite } = useFavorites();
  const isFavorite = useTradingStore((state) =>
    state.favoriteIds.includes(data.id),
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Чтобы клик по сердечку не перекидывал на страницу байка
    if (!isAuth) {
      alert("Войдите, чтобы добавлять в избранное"); // Позже заменим на красивую модалку
      return;
    }
    toggleFavorite(data.id);
  };
  //-----

  //Хелпер для извлечения бренда при разном формате входных данных:
  const brandName =
    typeof data.brand === "object"
      ? data.brand.name // Если прилетел объект (из избранного)
      : data.brand; // Если прилетела строка (из общего каталога)

  return (
    <Link
      to={`/catalog/motorcycles/${data.brandSlug}/${data.slug}`}
      className={cardClassName}
    >
      {viewMode === "grid" && (
        <div className={styles.imageBox}>
          {/*Изображение:*/}
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
          {/*Кнопка добавления в избранное:*/}
          <button
            className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ""}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? "Удалить из избранного" : "В избранное"}
          >
            {isFavorite ? "❤️" : "🤍"}
          </button>

          {/*Плашка высокого рейтинга:*/}
          {data.rating > 4.7 && <span className={styles.badge}>Top Rated</span>}

          {data.totalInStock && (
            <span className={styles.presence}>В наличии</span>
          )}
        </div>
      )}

      <div className={styles.info}>
        <div className={styles.mainTitleGroup}>
          <h3 className={styles.model}>{data.model}</h3>
          {viewMode === "list" && (
            <span className={styles.listBrand}>{brandName}</span>
          )}
        </div>

        <div className={styles.specs}>
          <span>{data.year} г.</span>
          <span>{data.displacement} см³</span>
          <span>{data.power !== 0 ? `${data.power} л.с.` : ""}</span>
          <span className={styles.rating}>★ {data.rating}</span>
        </div>

        <div className={styles.footer}>
          <span className={styles.price}>{data.price.toLocaleString()} ₽</span>

          <div className={styles.ratingAndAction}>
            {viewMode === "list" && (
              <button
                className={`${styles.listFavoriteBtn} ${isFavorite ? styles.active : ""}`}
                onClick={handleFavoriteClick}
                title={isFavorite ? "Удалить из избранного" : "В избранное"}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
            )}

            <AddToCartButton
              variant="card"
              data={{
                id: data.id,
                model: data.model,
                price: data.price,
                image: getImageUrlCart(data.mainImage),
                brandSlug: data.brandSlug,
                slug: data.slug,
                totalInStock: data.totalInStock,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};
