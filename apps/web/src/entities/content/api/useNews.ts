import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
import type { News } from "../types/types";

export const useNews = () => {
  return useQuery({
    queryKey: ["public-news"],
    queryFn: () => $api.get<News[]>("/content/news").then((res) => res.data),
  });
};
