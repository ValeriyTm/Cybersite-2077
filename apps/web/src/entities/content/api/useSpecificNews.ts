import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useSpecificNews = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["news-article", slug],
    queryFn: () => $api.get(`/content/news/${slug}`).then((res) => res.data),
    enabled: !!slug,
  });
};
