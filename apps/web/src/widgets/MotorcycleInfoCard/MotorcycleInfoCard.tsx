//Компоненты:
import { AddToCartButton, FavoriteButton } from "@/features/trading";
//Типы:
import { type MotorcycleFull } from "@repo/types";
//Утилиты:
import { getDiscountInfo } from "@/entities/catalog/lib/utils";
//Стили:
import styles from "./MotorcycleInfoCard.module.scss";

interface MotorcycleInfoCardProps {
  motorcycle: MotorcycleFull;
}

export const MotorcycleInfoCard = ({ motorcycle }: MotorcycleInfoCardProps) => {
  //Утилиты для расчета цен и скидок:
  const { currentPrice, hasDiscount, isPersonalDiscount } = getDiscountInfo(motorcycle);

  //Оосновное изображение для корзины:
  const mainImg = motorcycle.images?.find((img) => img.isMain)?.url || motorcycle.images?.[0]?.url || "";

  return (
    <div className={styles.mainInfo}>
      <h1 className={styles.title}>{motorcycle.model}</h1>
      <div className={styles.brandBadge}>{motorcycle.brand.name}</div>

      <div className={styles.actionRow}>
        {hasDiscount ? (
          <>
            <div className={styles.oldPrice}>
              {motorcycle.price.toLocaleString()} ₽
            </div>
            {isPersonalDiscount && (
              <span className={styles.personalDiscount}>
                Персональная скидка!
              </span>
            )}
            <div className={styles.price}>
              {currentPrice.toLocaleString()} ₽
            </div>
          </>
        ) : (
          <div className={styles.price}>
            {motorcycle.price.toLocaleString()} ₽
          </div>
        )}

        {motorcycle.totalInStock ? (
          <p>Количество единиц в наличии: {motorcycle.totalInStock}</p>
        ) : (
          <p>Нет в наличии</p>
        )}

        <div className={styles.buttons}>

          <div className={styles.btnWrapper}>
            <AddToCartButton
              variant="card"
              data={{
                id: motorcycle.id,
                model: motorcycle.model,
                price: motorcycle.price,
                image: mainImg,
                brandSlug: motorcycle.brand.slug,
                slug: motorcycle.slug,
                totalInStock: motorcycle.totalInStock,
                year: motorcycle.year,
              }}
            />
          </div>

          <div className={styles.btnWrapper}>
            <FavoriteButton motorcycleId={motorcycle.id} withText={true} />
          </div>

        </div>
      </div>

      <p className={styles.description}>
        {motorcycle.year} года выпуска. Объем двигателя {motorcycle.displacement} см³.
      </p>
      <p className={styles.description}>Текущий рейтинг: {Number(motorcycle.rating.toFixed(1))}</p>
      <p className={styles.description}>Артикул товара: {motorcycle.slug}</p>
    </div>
  );
};
