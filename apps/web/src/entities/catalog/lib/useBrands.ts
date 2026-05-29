import { useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api";

interface UseMotorcycleProps {
  page?: number;
  limit?: number;
  search?: string;
}

export const useBrands = ({
  page = 1,
  limit = 24,
  search,
}: UseMotorcycleProps) => {
  return useQuery({
    queryKey: ["brands", page, limit, search],
    queryFn: () =>
      $api
        .get(`/catalog/brands`, {
          params: { page, limit, search },
        })
        .then((res) => res.data),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
};
