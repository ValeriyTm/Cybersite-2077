import { useAuthStore } from "@/features/auth";
import { useTradingStore, useFavorites } from "@/entities/trading";
//Стили:
import styles from "./FavoriteButton.module.scss";

interface FavoriteButtonProps {
  motorcycleId: string;
  viewMode?: "grid" | "list";
}

export const FavoriteButton = ({ motorcycleId, viewMode = "grid" }: FavoriteButtonProps) => {
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
  const buttonClassName = viewMode === "list" ? styles.listFavoriteBtn : styles.favoriteBtn;

  return (
    <button
      type="button"
      className={`${buttonClassName} ${isFavorite ? styles.active : ""}`}
      onClick={handleFavoriteClick}
      title={isFavorite ? "Удалить из избранного" : "В избранное"}
    >
      {isFavorite ? "❤️" : "🤍"}
    </button>
  );
};
