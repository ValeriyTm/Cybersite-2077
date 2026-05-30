import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import { type MotorcycleResponse } from "@/entities/catalog";

interface MotoFilters {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  minYear: number | undefined;
  maxYear: number | undefined;
  minDisplacement: number | undefined;
  maxDisplacement: number | undefined;
  minPower: number | undefined;
  maxPower: number | undefined;
  category: string | undefined;
  transmission: string | undefined;
  onlyInStock: boolean;
}

interface UseCatalogMotorcyclesProps {
  brandSlug: string | undefined;
  filters: MotoFilters;
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
