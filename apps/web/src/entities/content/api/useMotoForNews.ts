import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useMotoForNews = (motoId: string) => {
  return useQuery({
    queryKey: ["news-moto-widget", motoId],
    queryFn: () =>
      $api.get(`/catalog/motorcycles/${motoId}`).then((res) => res.data),
  });
};
