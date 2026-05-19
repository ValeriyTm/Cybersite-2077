//Состояние:
import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useSiteCategories = () => {
  return useQuery({
    queryKey: ["site-categories"],
    queryFn: () => $api.get("/catalog/categories").then((res) => res.data),
    staleTime: 5 * 60 * 1000, // Так как категории меняются редко, то добавляем кэширование
  });
};
