import { useAuthStore } from "@/features/auth";
import { useTradingStore, useFavorites } from "@/entities/trading";
//Стили:
import styles from "./FavoriteButton.module.scss";

interface FavoriteButtonProps {
  motorcycleId: string;
  viewMode?: "grid" | "list";
  withText?: boolean;
}

export const FavoriteButton = ({ motorcycleId, viewMode = "grid", withText = false }: FavoriteButtonProps) => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const { toggleFavorite } = useFavorites();

  //Проверяем, находится ли данный байк в списке избранных:
  const isFavorite = useTradingStore((state) =>
    state.favoriteIds.includes(motorcycleId)
  );

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!isAuth) {
      alert("Войдите, чтобы добавлять в избранное"); //Когда-нибудь заменю на модалку
      return;
    }

    toggleFavorite(motorcycleId);
  };

  //Выбираем класс стилей в зависимости от режима отображения карточки:
  let buttonClassName = viewMode === "list" ? styles.listFavoriteBtn : styles.favoriteBtn;

  //Если передан флаг withText, используем специальный стиль для детальной страницы:
  if (withText) {
    buttonClassName = styles.detailsFavoriteBtn;
  }

  return (
    <button
      type="button"
      className={`${buttonClassName} ${isFavorite ? styles.active : ""}`}
      onClick={handleFavoriteClick}
      title={isFavorite ? "Удалить из избранного" : "В избранное"}
    >
      {isFavorite ? "❤️" : "🤍"}
      {withText && (
        <span className={styles.btnText}>
          {isFavorite ? " В избранном" : " В избранное"}
        </span>
      )}
    </button>
  );
};
