import { useQuery } from "@tanstack/react-query";
import { $api } from "@/shared/api";

interface UseMotorcycleProps {
  slug: string | undefined;
}

export const useRelatedMotos = ({ slug }: UseMotorcycleProps) => {
  return useQuery({
    queryKey: ["related", slug],
    queryFn: () =>
      $api.get(`catalog/motorcycles/${slug}/related`).then((res) => res.data),
  });
};
