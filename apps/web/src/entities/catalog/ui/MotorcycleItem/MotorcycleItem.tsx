//Роутинг:
import { Link } from "react-router";
//Типы:
import { type MotorcycleShort } from "@/entities/catalog/model";
import type { MotorcycleFull } from "@repo/types";
//Утилиты:
import {
  extractMainImage,
  getMotoImageUrl,
  extractBrandName,
  getDiscountInfo,
} from "@/entities/catalog/lib/utils";
//Изображения:
import defaultMotoImage from '@/shared/assets/images/defaults/default-card-icon.jpg'
//Стили:
import styles from "./MotorcycleItem.module.scss";

export interface MotorcycleItemProps {
  data: MotorcycleShort | MotorcycleFull;
  viewMode?: "grid" | "list";
  favoriteButtonSlot?: React.ReactNode; //Слот для кнопки "Избранного"
  actionButtonSlot?: React.ReactNode;  //Слот для кнопки "Корзины"
  onFavoritePage?: boolean; //Если компонент вызывается на странице избранного
}

export const MotorcycleItem = ({
  data,
  viewMode = "grid", //Вид карточки (сетка или список)
  favoriteButtonSlot,
  actionButtonSlot,
  onFavoritePage = false
}: MotorcycleItemProps) => {

  //Утилиты для подготовки данных:
  const mainImage = extractMainImage(data);
  const brandName = extractBrandName(data);
  const displayImageUrl = getMotoImageUrl(mainImage, defaultMotoImage);

  const { currentPrice, hasDiscount, isPersonalDiscount, discountPercent } = getDiscountInfo(data);

  const currentBrandSlug = data.brandSlug ?? (typeof data.brand === 'object' ? data.brand.slug : '');

  //Формируем динамический класс для всей карточки:
  const cardClassName = `${styles.Card} ${viewMode === "list" ? styles.listView : ""}`;

  return (
    <Link
      //Способ получения slug бренда зависит из места, откуда вызывается компонент:
      to={`/catalog/motorcycles/${currentBrandSlug}/${data.slug}`}
      className={cardClassName}
    >
      {viewMode === "grid" && (
        <div className={styles.imageBox}>
          {/*Изображение:*/}
          <img
            src={displayImageUrl}
            loading="lazy"
            decoding="async"
            alt={data.model}
            className={styles.img}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = defaultMotoImage;
            }}
            width='425'
            height='180'
          />

          {/*Бадж скидки */}
          {hasDiscount && (
            <div
              className={`${styles.badgeDiscount} ${isPersonalDiscount ? styles.personal : ""}`}
            >
              {isPersonalDiscount ? "ДЛЯ ВАС " : ""}-
              {discountPercent}%
            </div>
          )}

          {/*Тут будет кнопка добавления в избранное:*/}
          {favoriteButtonSlot}

          {/*Бадж высокого рейтинга:*/}
          {data.rating > 4.7 && <span className={styles.badge}>Top Rated</span>}

          {/*Бадж наличия*/}
          {data.totalInStock > 0 && (
            <span className={styles.presence}>В наличии</span>
          )}
        </div>
      )}

      <div className={onFavoritePage ? styles.infoFav : styles.info}>
        <div className={styles.mainTitleGroup}>
          <h3 className={styles.model} title={data.model}>{data.model}</h3>
          {viewMode === "list" && (
            <span className={styles.listBrand}>{brandName}</span>
          )}
        </div>

        <div className={styles.specs}>
          <span>{data.year} г.</span>
          {Number(data.displacement) > 0 && <span>{data.displacement} см³</span>}
          <span>{data.power ? `${data.power} л.с.` : "н/д л.с."}</span>
          <span className={styles.rating}>{data.rating.toFixed(1)} ★</span>
        </div>

        <div className={styles.footer}>
          <div className={styles.priceBlock}>
            {hasDiscount ? (
              <>
                {/*Старая цена:*/}
                <span className={styles.oldPrice}>
                  {data.price.toLocaleString()} ₽
                </span>
                {/*Актуальная цена с учетом скидки:*/}
                <span className={styles.newPrice}>
                  {currentPrice.toLocaleString()} ₽
                </span>
              </>
            ) : (
              //Просто цена (без скидки):
              <span className={styles.price}>
                {data.price.toLocaleString()} ₽
              </span>
            )}
          </div>

          <div className={styles.ratingAndAction}>

            {/*Тут будет кнопка избранного:*/}
            {viewMode === "list" && favoriteButtonSlot}

            {/*Тут будет для корзины:*/}
            {actionButtonSlot}
          </div>
        </div>
      </div>
    </Link>
  );
};
