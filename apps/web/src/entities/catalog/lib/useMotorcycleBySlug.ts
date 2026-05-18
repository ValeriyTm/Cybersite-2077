import { useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api";
import { type MotorcycleFull } from "@repo/types";

interface UseMotorcycleProps {
  brandSlug: string | undefined;
  slug: string | undefined;
}

export const useMotorcycleBySlug = ({
  brandSlug,
  slug,
}: UseMotorcycleProps) => {
  return useQuery({
    queryKey: ["motorcycle", slug],
    queryFn: () =>
      $api
        .get<MotorcycleFull>(
          `catalog/motorcycles/${brandSlug?.toLowerCase()}/${slug}`,
        )
        .then((res) => res.data),
    enabled: !!brandSlug && !!slug, //Запрос не выполнится, пока нет обоих параметров
  });
};
