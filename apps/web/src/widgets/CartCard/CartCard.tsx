//Компоненты:
import type { MotorcycleCart } from "@/entities/catalog";
import { CartItem } from "@/entities/trading";
import { AddToCartButton, FavoriteButton } from "@/features/trading";


interface CartCardProps {
  data: MotorcycleCart;
  handleDeletingId: (data: string) => void;
}

export const CartCard = ({ data, handleDeletingId }: CartCardProps) => {

  return (
    <CartItem
      key={data.id}
      data={data}
      handleDeletingId={handleDeletingId}
      favoriteButtonSlot={
        <FavoriteButton motorcycleId={data.id} viewMode="list" />
      }
      actionButtonSlot={
        <AddToCartButton
          variant="card"
          data={{
            id: data.id,
            model: data.model,
            price: data.price,
            slug: data.slug,
            totalInStock: data.totalInStock,
            year: data.year,
          }}
          onCartPage
        />
      }
    />
  );
};