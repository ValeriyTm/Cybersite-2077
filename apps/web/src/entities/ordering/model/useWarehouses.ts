import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useWarehouses = () => {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: () => $api.get("/warehouse").then((res) => res.data),
    staleTime: 24 * 60 * 60 * 1000, // 24 часа
  });
};
