import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { News } from "@/entities/content";

export const useAdminNews = () => {
  return useQuery({
    queryKey: ["admin-news"],
    queryFn: () => $api.get<News[]>("/admin/news").then((res) => res.data),
  });
};
