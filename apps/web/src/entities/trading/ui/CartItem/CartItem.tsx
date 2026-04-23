//Состояние:
import { useCart } from '../../api/useCart';
import { useTradingStore } from '../../model/tradingStore';
import { useFavorites } from '../../api/useFavorites';
//Роутинг:
import { Link } from "react-router";
//API:
import { API_URL } from '@/shared/api/api'
//Типы:
import { type MotorcycleCart } from "../../../catalog/model/types";
//Стили:
import styles from './CartItem.module.scss'

export interface CartCardProps {
  data: MotorcycleCart;
  handleDeletingId: (data: any) => void;
}


export const CartItem = ({ data, handleDeletingId }: CartCardProps) => {
  const {
    updateQuantity,
    toggleSelect,
  } = useCart();
  //Достаём массив избранных id товаров из Zustand:
  const favoriteIds = useTradingStore((state) => state.favoriteIds);
  const { toggleFavorite } = useFavorites();

  console.log('data: ', data)

  //Ошибка, если товара на складе осталось меньше, чем у нас в корзине:
  const isError = data.quantity > data.totalInStock;
  //Скидки:
  const hasDiscount =
    data.discountData && Number(data.discountData.discountPercent) > 0;
  const displayPrice: number = hasDiscount
    ? Number(data.discountData.finalPrice)
    : Number(data.price);

  //
  const handleCheckboxChange = () => {
    // Отправляем ID и инвертированное текущее состояние:
    toggleSelect({ id: data.id, selected: !data.selected });
  };

  return (
    <>
      <article
        key={data.id}
        className={`${styles.cartItem} ${isError && styles.Error}`}
      >
        {/*Чекбокс:*/}
        <div className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            checked={data.selected}
            onChange={handleCheckboxChange}

          />

        </div>

        {/*Img:*/}
        <div className={styles.itemImg}>
          <img
            src={
              (data.images?.length > 0)
                ? `${API_URL}/static/motorcycles/${data.images[0].url}`
                : `/images/default-card-icon.jpg`
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

        {/*Избранное и удаление с корзины:*/}
        <div className={styles.actions}>
          <div className={styles.btnGroup}>

            <button
              className={`${styles.favIconBtn} ${favoriteIds.includes(data.id) ? styles.active : ""}`}
              onClick={() => toggleFavorite(data.id)}
              title={
                favoriteIds.includes(data.id)
                  ? "Удалить из избранного"
                  : "В избранное"
              }
            >
              {favoriteIds.includes(data.id) ? "❤️" : "🤍"}
            </button>
            <button title='Удалить из корзины' onClick={() => handleDeletingId(data.id)} className={styles.deleteBtn}>
              Удалить
            </button>

          </div>

          {/*Количество:*/}
          <div className={styles.quantityControl}>
            <button
              title='Уменьшить количество товара в корзине'
              onClick={() =>
                updateQuantity({
                  id: data.id,
                  quantity: data.quantity - 1,
                })
              }
              className={styles.quantityBtn}
            >
              -
            </button>
            <span>{data.quantity}</span>
            <button
              title='Увеличить количество товара в корзине'
              onClick={() =>
                updateQuantity({
                  id: data.id,
                  quantity: data.quantity + 1,
                })
              }
              className={styles.quantityBtn}
            >
              +
            </button>
          </div>
        </div>




        {/*Цена:*/}
        <div className={styles.priceBlock}>
          {hasDiscount ? (
            <>
              {/*Старая цена:*/}
              <span className={styles.oldPrice}>
                {data.price?.toLocaleString() ?? 0} ₽ / шт.
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

        {isError && (
          <span className={styles.errorHint}>
            Ошибка: на складе осталось всего {data.totalInStock} шт.
          </span>
        )}
      </article>
    </>
  )
}