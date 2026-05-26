import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import { type MotorcycleResponse } from "@/entities/catalog";

interface UseCatalogMotorcyclesProps {
  brandSlug: string | undefined;
  filters: Record<string, any>;
}

export const useCatalogMotorcycles = ({
  brandSlug,
  filters,
}: UseCatalogMotorcyclesProps) => {
  return useQuery({
    queryKey: ["motorcycles", brandSlug, filters],

    queryFn: () =>
      $api
        .get<MotorcycleResponse>(`catalog/motorcycles/`, {
          params: { ...filters, brandSlug },
        })
        .then((res) => res.data),

    // Сохраняем прошлые данные при переключении фильтров/страниц для плавного UX
    placeholderData: (previousData) => previousData,

    // Кэшируем результат на 5 минут
    staleTime: 5 * 60 * 1000,
  });
};
