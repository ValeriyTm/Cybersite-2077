//Компоненты:
import { MotorcycleItem } from "@/entities/catalog";
import { AddToCartButton, FavoriteButton } from "@/features/trading";
//Утилиты:
import { getCartImageUrl, extractMainImage } from "@/entities/catalog/lib/utils"; // Импортируем хелпер для корзины
//Типы:
import type { MotorcycleShort } from "@/entities/catalog/model";
import type { MotorcycleFull } from "@repo/types";

interface MotorcycleCardProps {
  moto: MotorcycleShort | MotorcycleFull;
  viewMode?: "grid" | "list";
}

export const MotorcycleCard = ({ moto, viewMode = "grid" }: MotorcycleCardProps) => {
  const mainImage = extractMainImage(moto);
  const currentBrandSlug = moto.brandSlug ?? (typeof moto.brand === 'object' ? moto.brand.slug : '');

  return (
    <MotorcycleItem
      key={moto.id}
      data={moto}
      viewMode={viewMode}
      favoriteButtonSlot={
        <FavoriteButton motorcycleId={moto.id} viewMode={viewMode} />
      }
      actionButtonSlot={
        <AddToCartButton
          variant="card"
          data={{
            id: moto.id,
            model: moto.model,
            price: moto.price,
            image: getCartImageUrl(mainImage),
            brandSlug: currentBrandSlug,
            slug: moto.slug,
            totalInStock: moto.totalInStock,
            year: moto.year,
          }}
        />
      }
    />
  );
};