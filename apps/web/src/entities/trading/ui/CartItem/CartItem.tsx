//Состояние:
import { useCart } from '@/entities/trading/api';
//Роутинг:
import { Link } from "react-router";
//Компоненты:
import { Checkbox } from '@/shared/ui';
//Типы:
import { type MotorcycleCart } from "@/entities/catalog";
//API:
import { API_URL } from "@/shared/api";
//Изображения:
import defaultMotoImage from "@/shared/assets/images/defaults/default-card-icon.jpg";
//Стили:
import styles from './CartItem.module.scss'

export interface CartCardProps {
  data: MotorcycleCart;
  handleDeletingId: (data: string) => void;
  favoriteButtonSlot?: React.ReactNode; //Слот для кнопки "Избранного"
  actionButtonSlot?: React.ReactNode;  //Слот для кнопки "Корзины"
}

export const CartItem = (
  { data,
    handleDeletingId,
    favoriteButtonSlot,
    actionButtonSlot
  }: CartCardProps) => {
  const {
    toggleSelect,
  } = useCart();

  //Ошибка, если товара на складе осталось меньше, чем у нас в корзине:
  const isError = data.quantity > data.totalInStock;
  //Скидки:
  const hasDiscount =
    data.discountData && Number(data.discountData.discountPercent) > 0;
  const displayPrice: number = hasDiscount
    ? Number(data.discountData.finalPrice)
    : Number(data.price);

  const handleCheckboxChange = () => {
    toggleSelect({ id: data.id, selected: !data.selected });
  };

  return (
    <article
      key={data.id}
      className={`${styles.cartWrapper} ${(isError && data.selected) ? styles.Error : ''}`}
    >
      <div className={styles.cartItem}>
        {/*Чекбокс:*/}
        <div className={styles.checkboxWrapper}>
          <Checkbox
            label="Выбрать товар"
            checked={data.selected}
            onChange={handleCheckboxChange}
            single
          />
        </div>

        {/*Img:*/}
        <div className={styles.itemImg}>
          <img
            src={
              (data.images?.length > 0)
                ? `${API_URL}/static/motorcycles/${data.images[0].url}`
                : defaultMotoImage
            }
            alt="Motorcycle image"
            width='120'
            height='80'
          />
        </div>

        {/*Данные:*/}
        <div className={styles.itemInfo}>
          <Link
            to={`/catalog/motorcycles/${data.brandSlug}/${data.slug}`}
            className={styles.itemName}
          >
            <span>
              {data.model}, {data.year} г
            </span>
          </Link>
        </div>

        <div className={styles.actions}>
          <div className={styles.btnGroup}>

            {/* Тут будет кнопка добавить/удалить из избранного: */}
            {favoriteButtonSlot}

            {/* Удалить из корзины: */}
            <button title='Удалить из корзины' onClick={() => handleDeletingId(data.id)} className={styles.deleteBtn}>
              Удалить
            </button>
          </div>

          {/*Тут будет кнопка изменения количества товара в корзине:*/}
          {actionButtonSlot}
        </div>

        {/*Цена:*/}
        <div className={styles.priceBlock}>
          {hasDiscount ? (
            <>
              {/*Старая цена:*/}
              <span className={styles.oldPrice}>
                {data.price.toLocaleString() ?? 0} ₽ / шт.
              </span>
              {/*Новая цена:*/}
              <span className={styles.currentPrice}>
                {displayPrice.toLocaleString() ?? 0} ₽ / шт.
              </span>
              {/*Общая сумма:*/}
              <span className={styles.totalItemPrice}>
                {(displayPrice * data.quantity).toLocaleString()} ₽
              </span>
              {/*Скидка:*/}
              <span className={styles.badgeDiscount}>
                -{data.discountData.discountPercent}%
              </span>
            </>
          ) : (
            <>
              <span className={styles.currentPrice}>
                {data.price?.toLocaleString() ?? 0} ₽ / шт.
              </span>
              <span className={styles.totalItemPrice}>
                {(data.price * data.quantity).toLocaleString()} ₽
              </span>
            </>
          )}
        </div>
      </div>
      {isError && (
        <span className={styles.errorHint}>
          Внимание: на складе осталось всего {data.totalInStock} шт.
        </span>
      )}
    </article>
  )
}