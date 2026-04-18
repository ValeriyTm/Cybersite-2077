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
        // Отправляем ID и инвертированное текущее состояние
        toggleSelect({ id: data.id, selected: !data.selected });
    };

    return (
        <>
            <div
                key={data.id}
                className={`${styles.cartItem} ${isError && styles.Error}`}
            >
                <input
                    type="checkbox"
                    checked={data.selected}
                    onChange={handleCheckboxChange}
                />

                <div className={styles.itemImg}>
                    <img
                        src={
                            (data.images?.length > 0)
                                ? `${API_URL}/static/motorcycles/${data.images[0].url}`
                                : `${API_URL}/static/defaults/default-card-icon.jpg`
                        }
                        alt=""
                    />
                </div>

                <div className={styles.itemInfo}>
                    <Link
                        to={`/catalog/motorcycles/${data.brandSlug}/${data.slug}`}
                        className={styles.itemName}
                    >
                        <p>
                            {data.model}, {data.year} г
                        </p>
                    </Link>

                    <div className={styles.actions}>
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
                        <button onClick={() => handleDeletingId(data.id)}>
                            Удалить
                        </button>
                    </div>
                </div>

                <div className={styles.quantityControl}>
                    <button
                        onClick={() =>
                            updateQuantity({
                                id: data.id,
                                quantity: data.quantity - 1,
                            })
                        }
                    >
                        -
                    </button>
                    <span>{data.quantity}</span>
                    <button
                        onClick={() =>
                            updateQuantity({
                                id: data.id,
                                quantity: data.quantity + 1,
                            })
                        }
                    >
                        +
                    </button>
                </div>

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
            </div>
        </>
    )
}