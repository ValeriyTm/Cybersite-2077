import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { PromoData } from "../types/types";

export const usePromos = () => {
  return useQuery<PromoData[]>({
    queryKey: ["all-promos"],
    queryFn: () => $api.get("/discount/all-promos").then((res) => res.data),
  });
};
